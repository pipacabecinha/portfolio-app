export const COLLECTIONS_ORDER = [
  "Heranças de Cor e Coragem",
  "À Luz do Oceano",
  "Explorações Pictóricas",
  "Traços",
  "Comissões",
] as const;

export type Collection = (typeof COLLECTIONS_ORDER)[number];
