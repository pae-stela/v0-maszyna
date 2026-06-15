import { useState, useMemo, useEffect, useRef } from "react"
import { Plus, Trash2, Check, ShoppingCart, Calendar, ChevronDown, ChevronUp, X, RefreshCw, Pencil, CheckCheck, Wifi, WifiOff, Download } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { useDishes, useShoppingList } from "@/lib/realtime-hooks"
import type { ShoppingListRow } from "@/lib/realtime-hooks"

const CATEGORIES = [
  { id: "owoce-warzywa", label: "Owoce, warzywa i zioła", emoji: "🥬" },
  { id: "mięso-wędliny", label: "Mięso i wędliny", emoji: "🥩" },
  { id: "ryby-owoce-morza", label: "Ryby i owoce morza", emoji: "🐟" },
  { id: "nabiał-jaja", label: "Nabiał i jaja", emoji: "🥛" },
  { id: "pieczywo", label: "Pieczywo", emoji: "🍞" },
  { id: "sypkie", label: "Sypkie", emoji: "🌾" },
  { id: "konserwy", label: "Konserwy i przetwory", emoji: "🥫" },
  { id: "mrożonki", label: "Mrożonki", emoji: "❄️" },
  { id: "dania-gotowe", label: "Dania gotowe", emoji: "🍱" },
  { id: "słodycze", label: "Słodycze i przekąski", emoji: "🍫" },
  { id: "kawa-herbata", label: "Kawa i herbata", emoji: "☕" },
  { id: "woda-napoje", label: "Woda i napoje", emoji: "💧" },
  { id: "alkohole", label: "Alkohole", emoji: "🍷" },
  { id: "przyprawy", label: "Przyprawy, sosy i oleje", emoji: "🧂" },
  { id: "pieczenie", label: "Pieczenie i dodatki", emoji: "🫙" },
  { id: "środki-czystości", label: "Środki czystości", emoji: "🧹" },
  { id: "higiena", label: "Higiena", emoji: "🧴" },
  { id: "apteczka", label: "Apteczka", emoji: "💊" },
  { id: "dom-ogród", label: "Dom i ogród", emoji: "🏡" },
  { id: "papiernicze", label: "Papiernicze", emoji: "📋" },
  { id: "elektronika", label: "Elektronika", emoji: "🔋" },
  { id: "ubrania", label: "Ubrania", emoji: "👕" },
  { id: "dziecko", label: "Dziecko", emoji: "👶" },
  { id: "dla-zwierząt", label: "Dla zwierząt", emoji: "🐾" },
  { id: "inne", label: "Inne", emoji: "📦" },
] as const

type CategoryId = typeof CATEGORIES[number]["id"]


interface PlannerMeal {
  id: string
  name: string
  time: string
  dishId?: string
  owner: "patrycja" | "marcin" | "both" | null
}

const KEYWORD_MAP: { keywords: string[]; cat: CategoryId }[] = [
  { keywords: ["mleko","masło","ser ","serek","jogurt","jajk","śmietana","kefir","twaróg","ricotta","mozzarella","parmezan","feta","maślanka","skyr","brie","gouda","edam","camembert"], cat: "nabiał-jaja" },
  { keywords: ["kurczak","wołowina","wieprzowina","indyk","łopatka","schab","szynka","boczek","kiełbas","parówk","mielone","kotlet","żeberka","karkówka","wątróbka","golonka","polędwic","pierś","udko","pasztet","salami","chorizo","kabanos"], cat: "mięso-wędliny" },
  { keywords: ["łosoś","tuńczyk","dorsz","makrela","krewetk","małż","kalmary","śledź","sardynk","pstrąg","okoń","tilapia","halibut","fląd"], cat: "ryby-owoce-morza" },
  { keywords: ["jabłk","banan","pomarańcz","cytryn","marchew","ziemniak","pomidor","ogórek","cebul","czosnek","sałata","szpinak","brokuł","papryka","pietruszk","koper","kolendra","bazylia","tymianek","oregano","rozmary","por","grzyb","truskawk","malina","borówk","gruszk","winogrono","awokad","mango","ananas","kiwi","kapusta","kalafior","bakłażan","cukinia","dynia","burak","rzodkiewk","seler","fasola","groszek","kukurydza","szparagi","jarmuż","radicchio","endywia"], cat: "owoce-warzywa" },
  { keywords: ["chleb","bułk","bagietka","ciabatt","toast","pita","żytni","razow","tostow","chałka","drożdżówk","croissant","weka"], cat: "pieczywo" },
  { keywords: ["mąka","ryż","kasza","płatki","musli","makaron","cukier","sól ","soda","proszek do pieczenia","skrobia","komosa","quinoa","bulgur","couscous","semolin","len","siemię","pestki","ziarna"], cat: "sypkie" },
  { keywords: ["drożdże","wanilia","cynamon","rodzynk","bakalie","żelatyna","agar","baking","biszkopty","mąka krupczatka","proszek budyń","proszek kakao w torbie"], cat: "pieczenie" },
  { keywords: ["czekolad","ciastk","cukierek","chipsy","żelki","batonik","wafl","popcorn","precl","orzeszk","słony","krakersy","gofr","praliny","nugat","karmelki","ptasie mleczko"], cat: "słodycze" },
  { keywords: ["kawa","herbata","espresso","kakao","kapsułk","chai","matcha","rooibos","nescafé","cappuccino"], cat: "kawa-herbata" },
  { keywords: ["woda","napój","sok ","cola","sprite","lemoniada","izotonik","energy drink","kombucha","kefir pitny"], cat: "woda-napoje" },
  { keywords: ["wino","piwo","wódka","whisky","gin","likier","rum","szampan","prosecco","aperol","beer","wine"], cat: "alkohole" },
  { keywords: ["puszk","konserwa","przecier","dżem","miód","marmolada","pasta orzechowa","tahini","oliwki","kapary","musztarda w słoiku","ketchup w butelce","sos sojowy","sos oyster","sos rybny"], cat: "konserwy" },
  { keywords: ["mrożon","lody","frozen","mrożona pizza","mrożone warzywa"], cat: "mrożonki" },
  { keywords: ["pizza","sushi","kebab","gotow","danie gotowe","żarcie","hummus","guacamole","tapenada"], cat: "dania-gotowe" },
  { keywords: ["przyprawa","sos ","olej","oliwa","ocet","ketchup","musztarda","majonez","tabasco","harissa","sambal","chili sauce","worcestershire","sos pieprzowy","papryczka","kurkuma","imbir mielony","kardamon","kumin","kminek","kolendra mielona"], cat: "przyprawy" },
  { keywords: ["proszek do prania","płyn do mycia naczyń","środek czyszczący","papier toaletowy","ręcznik papierowy","worki","płyn","zmywark","odplamiacz","wybielacz","ocet spirytusowy","skrobak"], cat: "środki-czystości" },
  { keywords: ["szampon","żel pod prysznic","pasta do zębów","dezodorant","krem","podpaski","tampony","szczoteczka","płyn do płukania","maszynka","brzytwa","watki","patyczki","chusteczki"], cat: "higiena" },
  { keywords: ["paracetamol","ibuprofen","plaster","bandaż","aspiryna","witamin","suplement","magnez","cynk","żelazo","omega","probiotyk","leki","maść","krople do oczu","syrop"], cat: "apteczka" },
  { keywords: ["pampers","pieluch","chusteczki dla niemowlą","mleko modyfikowane","smoczek","butelka dla niemowl","papka","obiadek niemowlęcy"], cat: "dziecko" },
  { keywords: ["karma","kocurki","psia karma","karma dla kota","karma dla psa","legowisko","smakołyk dla psa","przysmak dla kota","kuweta","piasek do kuwety"], cat: "dla-zwierząt" },
  { keywords: ["zeszyt","długopis","notes","teczka","flamastr","kredki","marker","ołówek","linijka","klej","taśma","zszywacz"], cat: "papiernicze" },
  { keywords: ["kabel","ładowarka","baterie","słuchawki","adapter","pamięć usb","myszka","klawiatura","żarówka led","smart home"], cat: "elektronika" },
  { keywords: ["skarpetki","bielizna","t-shirt","spodnie","bluzka","bluza","kurtka","buty","rajstopy","śpiewające majtki"], cat: "ubrania" },
  { keywords: ["żarówka","gwoździe","śruby","detektor","rękawice robocze","nasiona","ziemia ogrodnicza","doniczka","nawóz","farba do ścian","pędzel","uszczelka","taśma izolacyjna","klamka"], cat: "dom-ogród" },
]

function categorize(name: string): CategoryId {
  const lower = name.toLowerCase()
  for (const { keywords, cat } of KEYWORD_MAP) {
    if (keywords.some(kw => lower.includes(kw))) return cat
  }
  return "inne"
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDatePl(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" })
}

export function ShoppingListScreen() {
  const { user } = useAuth()
  const { dishes } = useDishes()
  const {
    items, loading: listLoading, useLocal,
    addItem: hookAddItem, updateItem, removeItem,
    toggleItem, clearChecked, clearAll: hookClearAll,
  } = useShoppingList()

  const [inputName, setInputName] = useState("")
  const [inputQty, setInputQty] = useState("")
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())

  const [showImport, setShowImport] = useState(false)
  const [importDateFrom, setImportDateFrom] = useState(toLocalDateStr(new Date()))
  const [importDateTo, setImportDateTo] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 6); return toLocalDateStr(d)
  })
  const [importMealsByDate, setImportMealsByDate] = useState<Record<string, PlannerMeal[]>>({})
  const [loadingImport, setLoadingImport] = useState(false)
  const [selectedMeals, setSelectedMeals] = useState<Set<string>>(new Set())
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  // Inline editing (UI-only, no persistence needed)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editQty, setEditQty] = useState("")
  const [editCat, setEditCat] = useState<CategoryId>("inne")
  const editNameRef = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    const trimmed = inputName.trim()
    if (!trimmed) return
    hookAddItem({
      name: trimmed,
      category: categorize(trimmed),
      checked: false,
      quantity: inputQty.trim(),
      imported_from: null,
    })
    setInputName("")
    setInputQty("")
  }

  const startEdit = (item: ShoppingListRow) => {
    setEditingItemId(item.id)
    setEditName(item.name)
    setEditQty(item.quantity)
    setEditCat(item.category as CategoryId)
    setTimeout(() => editNameRef.current?.focus(), 50)
  }

  const commitEdit = () => {
    if (!editingItemId) return
    const trimmed = editName.trim()
    if (trimmed) updateItem(editingItemId, { name: trimmed, quantity: editQty.trim(), category: editCat })
    setEditingItemId(null)
  }

  const cancelEdit = () => setEditingItemId(null)

  const handleClearAll = () => {
    if (window.confirm("Wyczyścić całą listę zakupów?")) {
      hookClearAll()
      setEditingItemId(null)
    }
  }

  const toggleCategory = (catId: string) => {
    setCollapsedCats(prev => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  const itemsByCategory = useMemo(() => {
    const map = new Map<CategoryId, ShoppingListRow[]>()
    for (const item of items) {
      const cat = item.category as CategoryId
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(item)
    }
    return map
  }, [items])

  const checkedCount = items.filter(i => i.checked).length
  const totalCount = items.length

  const fetchImportMeals = async () => {
    if (!user) return
    setLoadingImport(true)
    setImportMealsByDate({})
    setSelectedMeals(new Set())
    setExpandedDays(new Set())
    try {
      const { data, error } = await supabase
        .from("planner_events")
        .select("*")
        .gte("date", importDateFrom)
        .lte("date", importDateTo)
        .eq("type", "meal")
        .order("date", { ascending: true })
        .order("time", { ascending: true })
      if (!error && data) {
        const byDate: Record<string, PlannerMeal[]> = {}
        for (const e of data as any[]) {
          let dishId: string | undefined
          let owner: PlannerMeal["owner"] = null
          try { const d = JSON.parse(e.details || "{}"); dishId = d.dishId; owner = d.owner || null } catch { }
          const meal: PlannerMeal = { id: e.id, name: e.name || "Posiłek", time: e.time || "00:00", dishId, owner }
          if (!byDate[e.date]) byDate[e.date] = []
          byDate[e.date].push(meal)
        }
        setImportMealsByDate(byDate)
        setExpandedDays(new Set(Object.keys(byDate)))
      }
    } catch { }
    setLoadingImport(false)
  }

  useEffect(() => {
    if (showImport) fetchImportMeals()
  }, [importDateFrom, importDateTo, showImport])

  const handleImport = () => {
    // Count unique cooking sessions per dish: same dish on same date = 1 session (one pot).
    // Different dates = separate sessions. This matches how marcinServings/patrycjaServings
    // are already baked into the recipe ingredient amounts.
    const sessions: Record<string, { batches: number; name: string; firstDate: string }> = {}
    const wholeMeals: Array<{ meal: PlannerMeal; date: string }> = []

    for (const [date, meals] of Object.entries(importMealsByDate)) {
      const seenDishesThisDate = new Set<string>()
      for (const meal of meals) {
        if (!selectedMeals.has(meal.id)) continue
        if (meal.dishId) {
          if (!sessions[meal.dishId]) sessions[meal.dishId] = { batches: 0, name: meal.name, firstDate: date }
          if (!seenDishesThisDate.has(meal.dishId)) {
            sessions[meal.dishId].batches += 1
            seenDishesThisDate.add(meal.dishId)
          }
        } else {
          wholeMeals.push({ meal, date })
        }
      }
    }

    // Import ingredients scaled by number of cooking sessions
    for (const [dishId, { batches, name, firstDate }] of Object.entries(sessions)) {
      const dish = dishes.find(d => d.id === dishId)
      const importedFrom = { dishName: name, date: firstDate }
      if (dish && Array.isArray(dish.elements) && dish.elements.length > 0) {
        for (const el of dish.elements) {
          const elName: string = el?.name || (el as any)?.ingredient_name || (typeof el === "string" ? el : "")
          if (!elName) continue
          const baseGrams = el?.grams ? Number(el.grams) : 0
          const scaledQty = baseGrams > 0 ? `${Math.round(baseGrams * batches)}g` : batches > 1 ? `×${batches}` : ""
          const existing = items.find(i => i.name.toLowerCase() === elName.toLowerCase())
          if (existing) {
            updateItem(existing.id, { quantity: scaledQty || existing.quantity })
          } else {
            hookAddItem({ name: elName, category: categorize(elName), checked: false, quantity: scaledQty, imported_from: importedFrom })
          }
        }
      } else {
        const qtyNote = batches > 1 ? `×${batches} razy` : ""
        hookAddItem({ name: name, category: categorize(name), checked: false, quantity: qtyNote, imported_from: importedFrom })
      }
    }

    // Whole meals (no dishId linked) — add once per unique meal name
    const addedWhole = new Set<string>()
    for (const { meal, date } of wholeMeals) {
      if (!addedWhole.has(meal.name.toLowerCase())) {
        hookAddItem({ name: meal.name, category: categorize(meal.name), checked: false, quantity: "", imported_from: { dishName: meal.name, date } })
        addedWhole.add(meal.name.toLowerCase())
      }
    }

    setShowImport(false)
  }

  const importedDates = useMemo(() => {
    const dates = new Set<string>()
    items.forEach(i => { if (i.imported_from?.date) dates.add(i.imported_from.date) })
    return [...dates].sort()
  }, [items])

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Sync status banner */}
      {useLocal && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400">
          <WifiOff className="size-3.5 shrink-0" />
          <span>Tryb lokalny — uruchom migrację SQL w Supabase, aby włączyć synchronizację między urządzeniami.</span>
        </div>
      )}
      {!useLocal && !listLoading && (
        <div className="flex items-center justify-end gap-1.5 px-1">
          <Wifi className="size-3 text-primary/60" />
          <span className="text-[10px] text-primary/60 font-medium">Synchronizowane</span>
        </div>
      )}

      {/* Add Item Input */}
      <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputName}
            onChange={e => setInputName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="Dodaj produkt..."
            className="flex-1 bg-secondary/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-primary/30"
          />
          <input
            type="text"
            value={inputQty}
            onChange={e => setInputQty(e.target.value)}
            placeholder="il."
            className="w-16 bg-secondary/50 rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-primary/30 text-center"
          />
          <button
            onClick={handleAdd}
            disabled={!inputName.trim()}
            className="p-3 bg-primary text-primary-foreground rounded-xl disabled:opacity-40 transition-opacity flex items-center justify-center"
          >
            <Plus className="size-5" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary/80 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors border border-border"
          >
            <Calendar className="size-4" />
            Importuj z planera
          </button>
          {checkedCount > 0 && (
            <button
              onClick={clearChecked}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium transition-colors border border-destructive/20"
            >
              <CheckCheck className="size-3.5" />
              Usuń kupione ({checkedCount})
            </button>
          )}
          {totalCount > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-secondary/80 text-muted-foreground hover:text-destructive text-xs font-medium transition-colors border border-border"
              title="Wyczyść całą listę"
            >
              <Trash2 className="size-3.5" />
              Wyczyść
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">
            {checkedCount} z {totalCount} produktów kupionych
          </span>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Imported from planner badges */}
      {importedDates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {importedDates.map(date => (
            <div
              key={date}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-medium text-primary"
            >
              <Calendar className="size-3" />
              Zaimportowano z {formatDatePl(date)}
            </div>
          ))}
        </div>
      )}

      {/* Category groups */}
      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="size-16 rounded-2xl bg-secondary flex items-center justify-center">
            <ShoppingCart className="size-7 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Lista jest pusta</p>
            <p className="text-xs text-muted-foreground">Dodaj produkty ręcznie lub zaimportuj z planera</p>
          </div>
        </div>
      ) : (
        CATEGORIES
          .filter(cat => itemsByCategory.has(cat.id as CategoryId))
          .map(cat => {
            const catItems = itemsByCategory.get(cat.id as CategoryId) || []
            const uncheckedCount = catItems.filter(i => !i.checked).length
            const isCollapsed = collapsedCats.has(cat.id)

            return (
              <div key={cat.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl leading-none">{cat.emoji}</span>
                    <div className="text-left">
                      <span className="text-sm font-medium text-foreground">{cat.label}</span>
                      {uncheckedCount < catItems.length && (
                        <span className="ml-2 text-[10px] text-primary font-medium">
                          {catItems.length - uncheckedCount} kupione
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                      {uncheckedCount > 0 ? uncheckedCount : `✓ ${catItems.length}`}
                    </span>
                    {isCollapsed
                      ? <ChevronDown className="size-4 text-muted-foreground" />
                      : <ChevronUp className="size-4 text-muted-foreground" />
                    }
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="px-4 pb-3 flex flex-col gap-1.5">
                    {catItems.map(item => {
                      const isEditing = editingItemId === item.id
                      if (isEditing) {
                        return (
                          <div key={item.id} className="flex flex-col gap-2 p-2.5 rounded-xl bg-secondary/50 border border-primary/20">
                            <div className="flex gap-2">
                              <input
                                ref={editNameRef}
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit() }}
                                className="flex-1 bg-background rounded-lg px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border"
                                placeholder="Nazwa produktu"
                              />
                              <input
                                value={editQty}
                                onChange={e => setEditQty(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit() }}
                                className="w-14 bg-background rounded-lg px-2 py-1.5 text-sm text-foreground text-center outline-none focus:ring-2 focus:ring-primary/40 border border-border"
                                placeholder="il."
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={editCat}
                                onChange={e => setEditCat(e.target.value as CategoryId)}
                                className="flex-1 bg-background rounded-lg px-2 py-1.5 text-xs text-foreground outline-none border border-border"
                              >
                                {CATEGORIES.map(c => (
                                  <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                                ))}
                              </select>
                              <button onClick={commitEdit} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">Zapisz</button>
                              <button onClick={cancelEdit} className="px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-secondary">Anuluj</button>
                            </div>
                          </div>
                        )
                      }
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                            item.checked ? "opacity-50" : ""
                          } hover:bg-secondary/30 group`}
                        >
                          <button
                            onClick={() => toggleItem(item.id)}
                            className={`shrink-0 size-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              item.checked
                                ? "bg-primary border-primary"
                                : "border-muted-foreground/40 hover:border-primary"
                            }`}
                          >
                            {item.checked && <Check className="size-3.5 text-primary-foreground" strokeWidth={3} />}
                          </button>

                          <span
                            className={`flex-1 text-sm cursor-pointer ${item.checked ? "line-through text-muted-foreground" : "text-foreground"}`}
                            onClick={() => !item.checked && startEdit(item)}
                          >
                            {item.name}
                          </span>

                          {item.quantity && (
                            <span
                              className="text-[11px] text-muted-foreground font-mono bg-secondary/70 px-1.5 py-0.5 rounded-lg cursor-pointer hover:bg-primary/10"
                              onClick={() => !item.checked && startEdit(item)}
                            >
                              {item.quantity}
                            </span>
                          )}

                          {item.imported_from && (
                            <span className="text-[10px] text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap max-w-[80px] truncate">
                              📅 {item.imported_from.dishName}
                            </span>
                          )}

                          <button
                            onClick={() => startEdit(item)}
                            className="shrink-0 p-1 rounded-lg text-muted-foreground/30 hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Pencil className="size-3" />
                          </button>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="shrink-0 p-1 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
      )}

      {/* Import Modal — multi-day + portions */}
      {showImport && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 p-4 pb-24">
          <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[82vh]">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="size-5 text-primary" />
                <h3 className="font-semibold text-foreground">Importuj z planera</h3>
              </div>
              <button onClick={() => setShowImport(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            {/* Date range */}
            <div className="p-4 border-b border-border shrink-0 flex gap-3">
              <div className="flex-1">
                <label className="block text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">Od</label>
                <input
                  type="date"
                  value={importDateFrom}
                  onChange={e => setImportDateFrom(e.target.value)}
                  className="w-full bg-secondary/50 rounded-xl px-3 py-2 text-sm text-foreground border border-border outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">Do</label>
                <input
                  type="date"
                  value={importDateTo}
                  min={importDateFrom}
                  onChange={e => setImportDateTo(e.target.value)}
                  className="w-full bg-secondary/50 rounded-xl px-3 py-2 text-sm text-foreground border border-border outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Meals grouped by day */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {loadingImport ? (
                <div className="flex items-center justify-center py-10">
                  <RefreshCw className="size-5 text-muted-foreground animate-spin" />
                </div>
              ) : Object.keys(importMealsByDate).length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-muted-foreground">Brak posiłków w wybranym zakresie dat</p>
                </div>
              ) : (
                Object.entries(importMealsByDate).map(([date, meals]) => {
                  const isExpanded = expandedDays.has(date)
                  const daySelected = meals.filter(m => selectedMeals.has(m.id)).length
                  const allSelected = daySelected === meals.length

                  return (
                    <div key={date} className="bg-secondary/40 rounded-xl border border-border overflow-hidden">
                      {/* Day header */}
                      <div className="flex items-center gap-2 p-3">
                        <button
                          onClick={() => {
                            setSelectedMeals(prev => {
                              const next = new Set(prev)
                              if (allSelected) meals.forEach(m => next.delete(m.id))
                              else meals.forEach(m => next.add(m.id))
                              return next
                            })
                          }}
                          className={`shrink-0 size-5 rounded border-2 flex items-center justify-center transition-all ${
                            allSelected ? "bg-primary border-primary" : daySelected > 0 ? "bg-primary/30 border-primary" : "border-muted-foreground/40"
                          }`}
                        >
                          {allSelected && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
                        </button>
                        <button
                          className="flex-1 flex items-center justify-between"
                          onClick={() => setExpandedDays(prev => {
                            const next = new Set(prev)
                            if (next.has(date)) next.delete(date); else next.add(date)
                            return next
                          })}
                        >
                          <span className="text-sm font-semibold text-foreground">{formatDatePl(date)}</span>
                          <div className="flex items-center gap-2">
                            {daySelected > 0 && (
                              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{daySelected}/{meals.length}</span>
                            )}
                            {isExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                          </div>
                        </button>
                      </div>

                      {/* Meals in this day */}
                      {isExpanded && (
                        <div className="px-3 pb-3 flex flex-col gap-2 border-t border-border/50">
                          {meals.map(meal => {
                            const dish = meal.dishId ? dishes.find(d => d.id === meal.dishId) : null
                            const hasIngredients = dish && Array.isArray(dish.elements) && dish.elements.length > 0
                            const selected = selectedMeals.has(meal.id)
                            const ownerLabel = meal.owner === "marcin" ? "M" : meal.owner === "patrycja" ? "P" : null

                            return (
                              <button
                                key={meal.id}
                                onClick={() => setSelectedMeals(prev => {
                                  const next = new Set(prev)
                                  if (next.has(meal.id)) next.delete(meal.id); else next.add(meal.id)
                                  return next
                                })}
                                className={`mt-2 w-full p-3 rounded-xl border-2 text-left transition-all ${selected ? "border-primary bg-primary/5" : "border-transparent bg-background hover:border-border"}`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`shrink-0 size-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
                                    {selected && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{meal.name}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                      {meal.time}
                                      {hasIngredients ? ` · ${(dish as any).elements.length} skł.` : " · całe danie"}
                                    </p>
                                  </div>
                                  {ownerLabel && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ownerLabel === "M" ? "bg-navy/15 text-navy" : "bg-sage/20 text-sage"}`}>
                                      {ownerLabel}
                                    </span>
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border shrink-0">
              <button
                onClick={handleImport}
                disabled={selectedMeals.size === 0}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Download className="size-4" />
                Dodaj do listy ({selectedMeals.size} posiłków)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
