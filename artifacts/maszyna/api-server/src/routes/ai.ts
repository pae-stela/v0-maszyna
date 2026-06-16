import { Router } from "express"

const router = Router()

router.post("/meal-suggestion", async (req, res) => {
  const apiKey = process.env["OPENAI_API_KEY"]
  if (!apiKey) {
    res.status(503).json({ error: "OPENAI_API_KEY not configured" })
    return
  }

  const { remaining, targets, lang } = req.body as {
    remaining: { calories: number; protein: number; carbs: number; fats: number }
    targets: { calories: number; protein: number; carbs: number; fats: number }
    lang: "pl" | "en"
  }

  if (!remaining) {
    res.status(400).json({ error: "Missing remaining macros" })
    return
  }

  const isPolish = lang === "pl"

  const systemPrompt = isPolish
    ? `Jesteś asystentem dietetycznym. Twoja rola to zaproponowanie JEDNEGO bardzo prostego i szybkiego posiłku (koktajl/shake, kanapka, tost, wrap, jajecznica, owsianka, jogurt z dodatkami itp.), który idealnie uzupełni brakujące makroskładniki na dany dzień. Posiłek musi być banalnie prosty do przygotowania - maksymalnie 5 minut, bez gotowania lub z minimalnym gotowaniem. Odpowiadaj zawsze w formacie JSON. Skupiaj się na: shake/koktajlu białkowym, kanapce/toście, wracie, jajecznici lub jogurt z owocami/muesli.`
    : `You are a dietary assistant. Your role is to suggest ONE very simple and quick meal (protein shake, sandwich, toast, wrap, scrambled eggs, oatmeal, yogurt with toppings, etc.) that will almost perfectly fill the remaining daily macros. The meal must be extremely simple to prepare — max 5 minutes, no cooking or minimal cooking required. Always respond in JSON format. Focus on: protein shakes, sandwiches/toast, wraps, scrambled eggs, or yogurt with fruit/granola.`

  const userPrompt = isPolish
    ? `Brakujące makroskładniki na dziś:
- Kalorie: ${Math.round(remaining.calories)} kcal
- Białko: ${Math.round(remaining.protein)}g
- Węglowodany: ${Math.round(remaining.carbs)}g
- Tłuszcze: ${Math.round(remaining.fats)}g

Zaproponuj jeden prosty posiłek. Odpowiedź TYLKO w JSON:
{
  "name": "Nazwa posiłku",
  "description": "Jednozdaniowy opis",
  "ingredients": ["składnik 1 z ilością", "składnik 2 z ilością"],
  "macros": { "calories": 0, "protein": 0, "carbs": 0, "fats": 0 }
}`
    : `Remaining macros today:
- Calories: ${Math.round(remaining.calories)} kcal
- Protein: ${Math.round(remaining.protein)}g
- Carbs: ${Math.round(remaining.carbs)}g
- Fats: ${Math.round(remaining.fats)}g

Suggest one simple meal. Reply ONLY in JSON:
{
  "name": "Meal name",
  "description": "One-sentence description",
  "ingredients": ["ingredient 1 with amount", "ingredient 2 with amount"],
  "macros": { "calories": 0, "protein": 0, "carbs": 0, "fats": 0 }
}`

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 400,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      res.status(502).json({ error: `OpenAI error: ${response.status}`, detail: err })
      return
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>
    }
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      res.status(502).json({ error: "Empty response from OpenAI" })
      return
    }

    const parsed = JSON.parse(content)
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: "Internal server error" })
  }
})

export default router
