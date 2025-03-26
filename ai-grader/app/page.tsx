"use client";

import { useState, useEffect, useRef } from "react";

type Message = {
	role: "user" | "assistant";
	content: string;
};

export default function Home() {
	const [assignment, setAssignment] = useState("");
	const [rubric, setRubric] = useState("");
	const [studentAnswer, setStudentAnswer] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [followUpQuestion, setFollowUpQuestion] = useState("");
	const [conversation, setConversation] = useState<Message[]>([]);
	const [animatedResponse, setAnimatedResponse] = useState("");
	const endRef = useRef<HTMLDivElement | null>(null);

	const sendToAI = async (messages: Message[]) => {
		try {
			const res = await fetch("/api/grade", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ messages }),
			});

			const data = await res.json();

			if (res.ok) {
				const newAIMessage: Message = {
					role: "assistant",
					content: data.result,
				};
				setConversation((prev) => [...prev, newAIMessage]);
			} else {
				setError(data.result || "Något gick fel.");
			}
		} catch (err) {
			console.error("❌ Fel vid AI-anrop:", err);
			setError("Kunde inte kontakta AI-servern.");
		} finally {
			setLoading(false);
		}
	};

	const handleInitialSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setConversation([]);
		setAnimatedResponse("");

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

		const initialMessage: Message = { role: "user", content: prompt };
		setConversation([initialMessage]);
		await sendToAI([initialMessage]);
	};

	const handleFollowUp = async () => {
		if (!followUpQuestion) return;
		setLoading(true);
		setError("");
		setAnimatedResponse("");

		const followUp: Message = { role: "user", content: followUpQuestion };
		const newMessages = [...conversation, followUp];
		setConversation(newMessages);
		setFollowUpQuestion("");

		await sendToAI(newMessages);
	};

	useEffect(() => {
		if (loading) return;
		const last = conversation[conversation.length - 1];
		if (last?.role !== "assistant") return;

		let index = 0;
		setAnimatedResponse("");
		const interval = setInterval(() => {
			setAnimatedResponse((prev) => prev + last.content[index]);
			index++;

			if (endRef.current) {
				endRef.current.scrollIntoView({ behavior: "smooth" });
			}

			if (index >= last.content.length) clearInterval(interval);
		}, 15);

		return () => clearInterval(interval);
	}, [conversation, loading]);

	return (
		<main className="min-h-screen p-8 bg-gray-900 text-white flex flex-col gap-8">
			<h1 className="text-4xl font-bold text-center mb-4">
				🧠 AI Provrättning
			</h1>

			<div className="flex gap-6">
				{/* Vänster */}
				<div className="w-1/2">
					<form onSubmit={handleInitialSubmit} className="space-y-6">
						<div>
							<label className="block font-semibold mb-1">
								📝 Själva uppgiften
							</label>
							<textarea
								className="w-full h-48 p-2 rounded bg-gray-800 text-white border border-gray-700"
								placeholder="Klistra in uppgiften här..."
								value={assignment}
								onChange={(e) => setAssignment(e.target.value)}
							/>
						</div>

						<div>
							<label className="block font-semibold mb-1">
								📊 Betygsmatris
							</label>
							<textarea
								className="w-full h-60 p-2 rounded bg-gray-800 text-white border border-gray-700"
								placeholder="Klistra in betygsmatris här..."
								value={rubric}
								onChange={(e) => setRubric(e.target.value)}
							/>
						</div>

						<div>
							<label className="block font-semibold mb-1">
								✍️ Elevens svar
							</label>
							<textarea
								className="w-full h-60 p-2 rounded bg-gray-800 text-white border border-gray-700"
								placeholder="Klistra in elevens svar här..."
								value={studentAnswer}
								onChange={(e) => setStudentAnswer(e.target.value)}
							/>
						</div>

						<button
							type="submit"
							className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
							disabled={loading}
						>
							{loading ? "AI tänker..." : "Analysera & Betygsätt"}
						</button>
					</form>
				</div>

				{/* Höger – AI-panel */}
				<div className="w-1/2 bg-gray-800 border border-gray-600 rounded p-4 flex flex-col justify-between text-lg h-[880px] mt-[65px]">
					<div className="overflow-auto max-h-[700px] space-y-4 pr-2">
						<h2 className="text-xl font-semibold mb-2">📋 AI:s bedömning</h2>

						{error && <p className="text-red-400">❌ {error}</p>}

						{conversation.slice(1).map((msg, index) => (
							<div
								key={index}
								className="text-lg space-y-1 border-b border-gray-700 pb-3 mb-3"
							>
								<p
									className={`font-bold ${
										msg.role === "user" ? "text-white" : "text-purple-400"
									}`}
								>
									{msg.role === "user" ? "Lärare" : "AIGrader"}
								</p>

								<p className="whitespace-pre-wrap text-gray-200 leading-relaxed">
									{msg.role === "assistant" &&
									index === conversation.length - 2 &&
									!loading ? (
										<span>{animatedResponse}</span>
									) : (
										msg.content
									)}
								</p>
							</div>
						))}

						{loading && (
							<div className="text-gray-400 animate-pulse">AI tänker...</div>
						)}

						<div ref={endRef} />
					</div>

					{/* Frågeruta + snabbknappar */}
					{conversation.length > 1 && !loading && (
						<div className="mt-4 space-y-4">
							<div>
								<label className="block text-sm mb-1">
									🔁 Följdfråga till AI
								</label>
								<div className="flex gap-2">
									<input
										type="text"
										value={followUpQuestion}
										onChange={(e) => setFollowUpQuestion(e.target.value)}
										placeholder="Ställ följdfrågor till AiGrader"
										className="flex-1 p-2 rounded bg-gray-700 text-white border border-gray-600"
									/>
									<button
										onClick={handleFollowUp}
										className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
									>
										Skicka
									</button>
								</div>
							</div>

							<div>
								<p className="text-sm text-gray-400">Snabba följdfrågor:</p>
								<div className="flex flex-wrap gap-2">
									{[
										"Motivera djupare",
										"Vilka områden kan eleven utveckla enligt matrisen?",
										"Vad bör eleven tänka på inför framtiden?",
									].map((q) => (
										<button
											key={q}
											onClick={() => {
												const followUp: Message = { role: "user", content: q };
												const newMessages = [...conversation, followUp];
												setConversation(newMessages);
												sendToAI(newMessages);
											}}
											className="bg-gray-700 text-white text-sm px-3 py-1 rounded hover:bg-gray-600"
										>
											{q}
										</button>
									))}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</main>
	);
}
