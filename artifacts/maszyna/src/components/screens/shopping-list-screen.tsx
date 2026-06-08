import { useState, useMemo, useCallback, useEffect } from "react"
import { Plus, Trash2, Check, ShoppingCart, Calendar, ChevronDown, ChevronUp, AlertTriangle, X, Download, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { useDishes } from "@/lib/realtime-hooks"

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

interface ShoppingItem {
  id: string
  name: string
  category: CategoryId
  checked: boolean
  quantity: string
  importedFrom?: { dishName: string; date: string; dishId?: string }
}

interface PlannerMeal {
  id: string
  name: string
  time: string
  dishId?: string
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

  const STORAGE_KEY = `shopping-list-v2-${user?.id || "local"}`

  const [items, setItems] = useState<ShoppingItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return JSON.parse(stored) as ShoppingItem[]
    } catch { }
    return []
  })

  const [inputName, setInputName] = useState("")
  const [inputQty, setInputQty] = useState("")
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())

  const [showImport, setShowImport] = useState(false)
  const [importDate, setImportDate] = useState(toLocalDateStr(new Date()))
  const [importMeals, setImportMeals] = useState<PlannerMeal[]>([])
  const [loadingImport, setLoadingImport] = useState(false)
  const [selectedMeals, setSelectedMeals] = useState<Set<string>>(new Set())

  const saveItems = useCallback((updated: ShoppingItem[]) => {
    setItems(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch { }
  }, [STORAGE_KEY])

  const addItem = (name: string, qty: string, category?: CategoryId, importedFrom?: ShoppingItem["importedFrom"]) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const cat = category ?? categorize(trimmed)
    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: trimmed,
      category: cat,
      checked: false,
      quantity: qty.trim(),
      importedFrom,
    }
    saveItems([...items, newItem])
  }

  const handleAdd = () => {
    addItem(inputName, inputQty)
    setInputName("")
    setInputQty("")
  }

  const toggleItem = (id: string) => {
    saveItems(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  }

  const removeItem = (id: string) => {
    saveItems(items.filter(i => i.id !== id))
  }

  const clearChecked = () => {
    saveItems(items.filter(i => !i.checked))
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
    const map = new Map<CategoryId, ShoppingItem[]>()
    for (const item of items) {
      if (!map.has(item.category)) map.set(item.category, [])
      map.get(item.category)!.push(item)
    }
    return map
  }, [items])

  const checkedCount = items.filter(i => i.checked).length
  const totalCount = items.length

  const fetchImportMeals = async (date: string) => {
    if (!user) return
    setLoadingImport(true)
    setImportMeals([])
    setSelectedMeals(new Set())
    try {
      const { data, error } = await supabase
        .from("planner_events")
        .select("*")
        .eq("date", date)
        .eq("type", "meal")
        .order("time", { ascending: true })
      if (!error && data) {
        const meals: PlannerMeal[] = data.map((e: any) => {
          let dishId: string | undefined
          try {
            const d = JSON.parse(e.details || "{}")
            dishId = d.dishId
          } catch { }
          return { id: e.id, name: e.name || "Posiłek", time: e.time || "00:00", dishId }
        })
        setImportMeals(meals)
      }
    } catch { }
    setLoadingImport(false)
  }

  useEffect(() => {
    if (showImport) fetchImportMeals(importDate)
  }, [importDate, showImport])

  const handleImport = () => {
    const mealsToImport = importMeals.filter(m => selectedMeals.has(m.id))
    const newItems: ShoppingItem[] = []

    for (const meal of mealsToImport) {
      const dish = meal.dishId ? dishes.find(d => d.id === meal.dishId) : null

      if (dish && Array.isArray(dish.elements) && dish.elements.length > 0) {
        for (const el of dish.elements) {
          const elName: string = el?.name || el?.ingredient_name || (typeof el === "string" ? el : "")
          if (elName) {
            const qty = el?.grams ? `${el.grams}g` : ""
            newItems.push({
              id: crypto.randomUUID(),
              name: elName,
              category: categorize(elName),
              checked: false,
              quantity: qty,
              importedFrom: { dishName: meal.name, date: importDate, dishId: meal.dishId },
            })
          }
        }
        if (newItems.filter(n => n.importedFrom?.dishId === meal.dishId).length === 0) {
          newItems.push({
            id: crypto.randomUUID(),
            name: meal.name,
            category: categorize(meal.name),
            checked: false,
            quantity: "",
            importedFrom: { dishName: meal.name, date: importDate, dishId: meal.dishId },
          })
        }
      } else {
        newItems.push({
          id: crypto.randomUUID(),
          name: meal.name,
          category: categorize(meal.name),
          checked: false,
          quantity: "",
          importedFrom: { dishName: meal.name, date: importDate },
        })
      }
    }

    const dedupedItems = newItems.filter(n => !items.some(i => i.name.toLowerCase() === n.name.toLowerCase()))
    saveItems([...items, ...dedupedItems])
    setShowImport(false)
  }

  const importedDates = useMemo(() => {
    const dates = new Set<string>()
    items.forEach(i => { if (i.importedFrom?.date) dates.add(i.importedFrom.date) })
    return [...dates].sort()
  }, [items])

  return (
    <div className="flex flex-col gap-4 pb-24">
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
              <Trash2 className="size-3.5" />
              Usuń kupione ({checkedCount})
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
                    {catItems.map(item => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                          item.checked ? "opacity-50" : ""
                        } hover:bg-secondary/30`}
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

                        <span className={`flex-1 text-sm ${item.checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {item.name}
                        </span>

                        {item.quantity && (
                          <span className="text-[11px] text-muted-foreground font-mono bg-secondary/70 px-1.5 py-0.5 rounded-lg">
                            {item.quantity}
                          </span>
                        )}

                        {item.importedFrom && (
                          <span className="text-[10px] text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap max-w-[80px] truncate">
                            📅 {item.importedFrom.dishName}
                          </span>
                        )}

                        <button
                          onClick={() => removeItem(item.id)}
                          className="shrink-0 p-1 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 p-4 pb-24">
          <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[75vh]">
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="size-5 text-primary" />
                <h3 className="font-semibold text-foreground">Importuj z planera</h3>
              </div>
              <button onClick={() => setShowImport(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 border-b border-border shrink-0">
              <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Wybierz dzień</label>
              <input
                type="date"
                value={importDate}
                onChange={e => setImportDate(e.target.value)}
                className="w-full bg-secondary/50 rounded-xl px-4 py-2.5 text-sm text-foreground border border-border outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {loadingImport ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="size-5 text-muted-foreground animate-spin" />
                </div>
              ) : importMeals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Brak posiłków zaplanowanych na ten dzień</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-1">
                    Wybierz posiłki do zaimportowania:
                  </p>
                  {importMeals.map(meal => {
                    const dish = meal.dishId ? dishes.find(d => d.id === meal.dishId) : null
                    const hasIngredients = dish && Array.isArray(dish.elements) && dish.elements.length > 0
                    const selected = selectedMeals.has(meal.id)
                    return (
                      <button
                        key={meal.id}
                        onClick={() => {
                          setSelectedMeals(prev => {
                            const next = new Set(prev)
                            if (next.has(meal.id)) next.delete(meal.id)
                            else next.add(meal.id)
                            return next
                          })
                        }}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-secondary/30 hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`shrink-0 size-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                            selected ? "bg-primary border-primary" : "border-muted-foreground/40"
                          }`}>
                            {selected && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{meal.name}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {meal.time}
                              {hasIngredients
                                ? ` · ${dish.elements.length} składników`
                                : " · dodany jako całe danie"
                              }
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </>
              )}
            </div>

            <div className="p-4 border-t border-border shrink-0">
              <button
                onClick={handleImport}
                disabled={selectedMeals.size === 0}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Download className="size-4" />
                Dodaj do listy ({selectedMeals.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
