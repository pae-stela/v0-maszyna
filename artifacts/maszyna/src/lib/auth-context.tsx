import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase/client'
import { User, RealtimeChannel } from '@supabase/supabase-js'

interface Profile {
  id: string
  name: string
  email: string
  account_type: 'single' | 'couple'
  partner_id: string | null
  partner_invite_code: string | null
}

interface UserSettings {
  weight: number | null
  height: number | null
  age: number | null
  sex: 'male' | 'female' | null
  activity_level: number
  calorie_goal: number
  protein_goal: number
  carbs_goal: number
  fats_goal: number
}

interface PartnerProfile {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  settings: UserSettings | null
  partner: PartnerProfile | null
  loading: boolean
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
  updateSettings: (data: Partial<UserSettings>) => Promise<void>
  linkPartner: (inviteCode: string) => Promise<{ success: boolean; error?: string }>
  unlinkPartner: () => Promise<void>
  ensureProfile: (user: User) => Promise<Profile | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [partner, setPartner] = useState<PartnerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const ensureProfile = async (currentUser: User): Promise<Profile | null> => {
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single()

    if (existing) {
      return existing as Profile
    }

    // No profile found — create one on demand (no DB trigger required)
    const name = currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'User'
    const accountType = currentUser.user_metadata?.account_type || 'single'
    const inviteCode = generateInviteCode()

    const { data: created, error } = await supabase
      .from('profiles')
      .insert({
        id: currentUser.id,
        name,
        email: currentUser.email || '',
        account_type: accountType,
        partner_invite_code: inviteCode,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create profile:', error)
      return null
    }

    // Also create default settings row
    await supabase
      .from('user_settings')
      .insert({
        user_id: currentUser.id,
        weight: null,
        height: null,
        age: null,
        sex: null,
        activity_level: 1.55,
        calorie_goal: 2000,
        protein_goal: 150,
        carbs_goal: 200,
        fats_goal: 65,
      })

    return created as Profile
  }

  const fetchUserData = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileData) {
      setProfile(profileData)

      if (profileData.partner_id) {
        const { data: partnerData } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('id', profileData.partner_id)
          .single()

        if (partnerData) {
          setPartner(partnerData)
        }
      }
    }

    const { data: settingsData } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (settingsData) {
      setSettings({
        weight: settingsData.weight,
        height: settingsData.height,
        age: settingsData.age,
        sex: settingsData.sex,
        activity_level: settingsData.activity_level || 1.55,
        calorie_goal: settingsData.calorie_goal || 2000,
        protein_goal: settingsData.protein_goal || 150,
        carbs_goal: settingsData.carbs_goal || 200,
        fats_goal: settingsData.fats_goal || 65,
      })
    }
  }

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          const profile = await ensureProfile(user)
          if (profile) setProfile(profile)
          await fetchUserData(user.id)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setUser(session?.user ?? null)

          if (session?.user) {
            const profile = await ensureProfile(session.user)
            if (profile) setProfile(profile)
            await fetchUserData(session.user.id)
          } else {
            setProfile(null)
            setSettings(null)
            setPartner(null)
          }
        } catch (err) {
          console.error('Auth state change error:', err)
          setUser(null)
          setProfile(null)
          setSettings(null)
          setPartner(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return

    let channel: RealtimeChannel

    const setupRealtime = async () => {
      channel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.new) {
              setProfile(payload.new as Profile)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_settings',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.new) {
              const s = payload.new as UserSettings & { user_id: string }
              setSettings({
                weight: s.weight,
                height: s.height,
                age: s.age,
                sex: s.sex,
                activity_level: s.activity_level || 1.55,
                calorie_goal: s.calorie_goal || 2000,
                protein_goal: s.protein_goal || 150,
                carbs_goal: s.carbs_goal || 200,
                fats_goal: s.fats_goal || 65,
              })
            }
          }
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSettings(null)
    setPartner(null)
  }

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (!error && profile) {
      setProfile({ ...profile, ...data })
    }
  }

  const updateSettings = async (data: Partial<UserSettings>) => {
    if (!user) return

    const { error } = await supabase
      .from('user_settings')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (!error && settings) {
      setSettings({ ...settings, ...data })
    }
  }

  const linkPartner = async (inviteCode: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !profile) return { success: false, error: 'Not logged in' }

    const { data: partnerProfile, error: findError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('partner_invite_code', inviteCode)
      .neq('id', user.id)
      .single()

    if (findError || !partnerProfile) {
      return { success: false, error: 'Invalid invite code' }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ partner_id: partnerProfile.id, account_type: 'couple' })
      .eq('id', user.id)

    if (updateError) {
      return { success: false, error: 'Failed to link partner' }
    }

    await supabase
      .from('profiles')
      .update({ partner_id: user.id, account_type: 'couple' })
      .eq('id', partnerProfile.id)

    setPartner(partnerProfile)
    setProfile({ ...profile, partner_id: partnerProfile.id, account_type: 'couple' })

    return { success: true }
  }

  const unlinkPartner = async () => {
    if (!user || !profile || !partner) return

    await supabase
      .from('profiles')
      .update({ partner_id: null, account_type: 'single' })
      .eq('id', user.id)

    await supabase
      .from('profiles')
      .update({ partner_id: null, account_type: 'single' })
      .eq('id', partner.id)

    setPartner(null)
    setProfile({ ...profile, partner_id: null, account_type: 'single' })
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      settings,
      partner,
      loading,
      signOut,
      updateProfile,
      updateSettings,
      linkPartner,
      unlinkPartner,
      ensureProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
