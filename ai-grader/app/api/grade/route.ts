import { NextResponse } from "next/server";

export async function POST(req: Request) {
	try {
		const body = await req.json();

		// Om det är ett följdfråge-anrop (med message-historik)
		if (body.messages) {
			const aiRes = await fetch(
				"https://openrouter.ai/api/v1/chat/completions",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
						"HTTP-Referer": "http://localhost:3000", // ändra till din domän i produktion
						"X-Title": "AIGrader",
					},
					body: JSON.stringify({
						model: "gpt-3.5-turbo",
						messages: body.messages,
						temperature: 0.3,
					}),
				}
			);

			if (!aiRes.ok) {
				const errorText = await aiRes.text();
				console.error("❌ OpenRouter error:", errorText);
				return NextResponse.json({
					result: "Fel från OpenRouter: " + errorText,
				});
			}

			const data = await aiRes.json();
			const result =
				data.choices?.[0]?.message?.content || "Inget svar från AI.";
			return NextResponse.json({ result });
		}

		// Om det är första bedömningen
		const { assignment, rubric, studentAnswer } = body;

		const prompt = `
🎓 Du är en mycket erfaren lärare. Din uppgift är att objektivt bedöma en elevs argumenterande text utifrån uppgiften, betygsmatrisen och elevens svar. Du får inte utgå från något betyg i förväg – du ska börja från noll.

📌 Regler för betyg:
- ✅ A: Alla A-kriterier är uppfyllda
- ✅ B: Alla C-kriterier är uppfyllda + några A-kriterier
- ✅ C: Alla C-kriterier är uppfyllda
- ✅ D: Alla E-kriterier är uppfyllda + några C-kriterier
- ✅ E: Alla E-kriterier är uppfyllda
- ✅ F: Om inte ens E-kriterierna uppfylls

📝 Uppgiften eleven svarar på:
${assignment}

📊 Betygsmatris:
${rubric}

✍️ Elevens svar:
${studentAnswer}

📋 Gör följande:
1. Sätt ett betyg (A–F)
2. Motivera tydligt utifrån matrisen
3. Beskriv varför det inte når högre betyg (om aktuellt)
4. Använd ett professionellt och tydligt språk
`;

		const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
				"HTTP-Referer": "http://localhost:3000", // byt till din domän i produktion
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
