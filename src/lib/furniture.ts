export interface FurnitureItem {
  id: string;
  label: string;
  views: {
    front: string;
    back?: string;
    left?: string;
    right?: string;
  };
  defaultWidth: number;
  defaultHeight: number;
  price?: number;
}

export const FURNITURE_ITEMS: FurnitureItem[] = [
  { 
    id: "chair", 
    label: "Chair", 
    views: { 
      front: "/furniture/chairfront.png",
      back: "/furniture/chairback.png", 
      left: "/furniture/chairleft.png", 
      right: "/furniture/chairright.png" 
    }, 
    defaultWidth: 90, 
    defaultHeight: 110,
    price: 75
  },
  { 
    id: "sofa", 
    label: "Sofa", 
    views: { 
      front: "/furniture/sofa.svg",
      back: "/furniture/sofa_back.svg", 
      left: "/furniture/sofa_left.svg", 
      right: "/furniture/sofa_right.svg" 
    }, 
    defaultWidth: 160, 
    defaultHeight: 100,
    price: 450
  },
  { 
    id: "table", 
    label: "Table", 
    views: { 
      front: "/furniture/table.png",
      back: "/furniture/table_back.svg", 
      left: "/furniture/table_left.svg", 
      right: "/furniture/table_right.svg" 
    }, 
    defaultWidth: 140, 
    defaultHeight: 100,
    price: 220
  },
  { 
    id: "lamp", 
    label: "Floor Lamp", 
    views: { 
      front: "/furniture/lamp.svg",
      back: "/furniture/lamp_back.svg", 
      left: "/furniture/lamp_left.svg", 
      right: "/furniture/lamp_right.svg" 
    }, 
    defaultWidth: 60, 
    defaultHeight: 160,
    price: 120
  },
  { 
    id: "plant", 
    label: "Plant", 
    views: { 
      front: "/furniture/plant.svg",
      back: "/furniture/plant_back.svg", 
      left: "/furniture/plant_left.svg", 
      right: "/furniture/plant_right.svg" 
    }, 
    defaultWidth: 80, 
    defaultHeight: 130,
    price: 45
  },
  { 
    id: "coffee-table", 
    label: "Coffee Table", 
    views: { 
      front: "/furniture/coffee-table.svg",
      back: "/furniture/coffee-table_back.svg", 
      left: "/furniture/coffee-table_left.svg", 
      right: "/furniture/coffee-table_right.svg" 
    }, 
    defaultWidth: 130, 
    defaultHeight: 80,
    price: 180
  },
  { 
    id: "bookshelf", 
    label: "Bookshelf", 
    views: { 
      front: "/furniture/bookshelf.svg",
      back: "/furniture/bookshelf_back.svg", 
      left: "/furniture/bookshelf_left.svg", 
      right: "/furniture/bookshelf_right.svg" 
    }, 
    defaultWidth: 110, 
    defaultHeight: 160,
    price: 250
  },
  { 
    id: "flower-vase", 
    label: "Flower Vase", 
    views: { 
      front: "/furniture/flower-vase.svg",
      back: "/furniture/flower-vase_back.svg", 
      left: "/furniture/flower-vase_left.svg", 
      right: "/furniture/flower-vase_right.svg" 
    }, 
    defaultWidth: 70, 
    defaultHeight: 130,
    price: 35
  },
  { 
    id: "dining-table", 
    label: "Dining Table", 
    views: { 
      front: "/furniture/dining-table.svg",
      back: "/furniture/dining-table_back.svg", 
      left: "/furniture/dining-table_left.svg", 
      right: "/furniture/dining-table_right.svg" 
    }, 
    defaultWidth: 160, 
    defaultHeight: 110,
    price: 550
  },
];
