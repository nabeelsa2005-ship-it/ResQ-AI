import emergencyData from "../data/emergencyData";

export const detectEmergency = (userInput) => {
  const input = userInput.toLowerCase().trim();

  if (!input) return null;

  let bestMatch = null;
  let highestScore = 0;

  Object.values(emergencyData).forEach((category) => {
    Object.values(category.subcategories).forEach((sub) => {
      let score = 0;
      sub.keywords.forEach((keyword) => {
        if (input.includes(keyword.toLowerCase())) {
          score += keyword.split(" ").length;
        }
      });

      if (score > highestScore) {
        highestScore = score;
        bestMatch = {
          category: category,
          subcategory: sub,
          confidence: score,
        };
      }
    });
  });

  return highestScore > 0 ? bestMatch : null;
};

export const getAllCategories = () => {
  return Object.values(emergencyData).map((cat) => ({
    id: cat.id,
    title: cat.title,
    icon: cat.icon,
    color: cat.color,
    emergencyNumber: cat.emergencyNumber,
    numberLabel: cat.numberLabel,
  }));
};

export const getCategoryById = (id) => {
  return emergencyData[id] || null;
}