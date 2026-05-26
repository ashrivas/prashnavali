import { config } from "../config";
import { deriveAnswer, type Answer } from "../core/chaupaiDerivation";
import { generateGuidance } from "../core/aiGuidance";
import type { Experience } from "./types";

export const ramPrashnavali: Experience = {
  id: "ram_prashnavali",

  copy: {
    greeting:
      "🙏 जय श्री राम 🙏\nराम शलाका प्रश्नावली में आपका स्वागत है। यह गोस्वामी तुलसीदास रचित श्रीरामचरितमानस पर आधारित एक प्राचीन मार्गदर्शन परंपरा है।",
    askPrompt:
      "अपना प्रश्न दिल से पूछें — लिख कर या आवाज़ में।",
    whatIsThis:
      "राम शलाका प्रश्नावली एक पवित्र परंपरा है। आप मन में एक प्रश्न रखते हैं और 1 से 225 के बीच एक संख्या चुनते हैं। उस संख्या से श्रीरामचरितमानस की एक चौपाई प्रकट होती है, जो आपके प्रश्न का मार्गदर्शन करती है।",
    gridImageUrl: config.assets.gridImageUrl,
    sankalpPrompt:
      "मन को शांत करें। आँखें बंद करें। जो संख्या मन में आए, वह यहाँ टाइप करें। (1 से 225 के बीच)",
    invalidNumber:
      "कृपया 1 से 225 के बीच एक संख्या भेजें।",
    generating:
      "श्री राम आपका मार्गदर्शन कर रहे हैं... आपका उत्तर तैयार हो रहा है। 🙏",
    askInText:
      "अभी कृपया अपना प्रश्न लिख कर भेजें। आवाज़ की सुविधा जल्द आ रही है।",
  },

  derive(square: number): Answer {
    return deriveAnswer(square);
  },

  guide(answer: Answer, question: string): Promise<string> {
    return generateGuidance(answer, question);
  },

  formatAnswerCard(answer: Answer): string {
    return [
      `*${answer.answer_line_devanagari}*`,
      `_${answer.answer_line_iast}_`,
      "",
      answer.meaning_hindi,
      "",
      `📿 ${answer.kand} — ${answer.prasang}`,
      answer.narrative_context_hindi,
    ].join("\n");
  },
};
