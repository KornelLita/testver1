import { NextResponse } from "next/server";

export async function POST(req: Request) {
	const { assignment, rubric, studentAnswer } = await req.json();

	// Generera prompt automatiskt
	const prompt = `
🎓 Du är en erfaren och objektiv lärare som betygsätter provsvar enligt Skolverkets kriterier. Du utgår från en uppgift, en betygsmatris och ett elevsvar.

📌 Betygsregler:
- A: Alla A-kriterier uppfyllda.
- B: Alla C-kriterier uppfyllda + vissa A-kriterier.
- C: Alla C-kriterier uppfyllda.
- D: Alla E-kriterier uppfyllda + vissa C-kriterier.
- E: Alla E-kriterier uppfyllda.
- F: Kraven för E är inte uppfyllda.

📝 Uppgift:
${assignment}

📊 Betygsmatris:
${rubric}

✍️ Elevsvar:
${studentAnswer}

✅ Din bedömning ska innehålla:
1. Det exakta betyget (A–F)
2. Tydlig motivering med koppling till matrisens formuleringar
3. En kort analys varför svaret inte når nästa nivå (om relevant)
`;

	try {
		const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
				"HTTP-Referer": "http://localhost:3000",
				"X-Title": "AIGrader",
			},
			body: JSON.stringify({
				model: "gpt-3.5-turbo",
				messages: [
					{
						role: "user",
						content: prompt,
					},
				],
				temperature: 0.3,
			}),
		});

		if (!aiRes.ok) {
			const errorText = await aiRes.text();
			console.error("❌ OpenRouter error:", errorText);
			return NextResponse.json({ result: "Fel från OpenRouter: " + errorText });
		}

		const data = await aiRes.json();
		const result = data.choices?.[0]?.message?.content || "Inget svar från AI.";

		return NextResponse.json({ result });
	} catch (error) {
		console.error("❌ AI-fel:", error);
		return NextResponse.json({ result: "Något gick fel vid AI-bedömning." });
	}
}
