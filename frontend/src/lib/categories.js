export const CATEGORIES = [
  {
    id: "pizza_tonda",
    label: "Pizza Tonda",
    tag: "Napoletana & Contemporanea",
    image:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxuZWFwb2xpdGFuJTIwcGl6emF8ZW58MHx8fHwxNzg3MDkxNzI1fDA&ixlib=rb-4.1.0&q=85",
  },
  {
    id: "pizza_teglia",
    label: "Pizza in Teglia",
    tag: "Alta idratazione",
    image:
      "https://images.unsplash.com/photo-1705537637301-956413896f3c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODR8MHwxfHNlYXJjaHwzfHxyb21hbiUyMHBpenphJTIwYWwlMjB0YWdsaW8lMjB0cmF5fGVufDB8fHx8MTc5MDM3MTYwNnww&ixlib=rb-4.1.0&q=85",
  },
  {
    id: "focaccia",
    label: "Focaccia",
    tag: "Genovese, barese & pugliese",
    image:
      "https://images.unsplash.com/photo-1621792955481-c99c3862283a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwzfHxmb2NhY2NpYXxlbnwwfHx8fDE3ODcwOTE3MjV8MA&ixlib=rb-4.1.0&q=85",
  },
  {
    id: "pane",
    label: "Pane",
    tag: "Lievito madre & diretti",
    image:
      "https://images.unsplash.com/photo-1549413468-cd78edb7e75c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHw0fHxhcnRpc2FuJTIwc291cmRvdWdoJTIwYnJlYWR8ZW58MHx8fHwxNzg3MDkxNzI1fDA&ixlib=rb-4.1.0&q=85",
  },
  {
    id: "grandi_lievitati",
    label: "Grandi Lievitati",
    tag: "Panettone, pandoro & colomba",
    image:
      "https://images.unsplash.com/photo-1481391145929-5bcf567d5211?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwxfHxwYW5ldHRvbmUlMjBjaHJpc3RtYXMlMjBzd2VldCUyMGJyZWFkfGVufDB8fHx8MTc5MDM3MTYwNnww&ixlib=rb-4.1.0&q=85",
  },
];

export const CATEGORY_MAP = CATEGORIES.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {});

export const PREFERMENT_LABELS = {
  diretto: "Impasto Diretto",
  biga: "Biga",
  poolish: "Poolish",
  water_roux: "Water Roux (Tangzhong)",
};

export const YEAST_LABELS = {
  fresco: "Lievito di birra fresco",
  secco: "Lievito di birra secco",
  madre: "Lievito madre (LM)",
};
