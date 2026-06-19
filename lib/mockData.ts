import { ScrapMetalPrice, VehicleYard } from "@/types/types";

export const mockYardVehicles: VehicleYard[] = [
  {
    id: "v1",
    make: "BMW",
    model: "3 Series",
    year: 2004,
    trim: "320D (E46)",
    arrivedDate: "Feb 20, 2026",
    status: "In Yard",
    color: "Titanium Silver",
    image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "v2",
    make: "Ford",
    model: "Focus",
    year: 2007,
    trim: "ST-2 2.5T",
    arrivedDate: "Feb 17, 2026",
    status: "In Yard",
    color: "Electric Orange",
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "v3",
    make: "Volkswagen",
    model: "Golf",
    year: 2005,
    trim: "GT-TDI (Mk5)",
    arrivedDate: "Feb 24, 2026",
    status: "In Yard",
    color: "Shadow Blue",
    image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "v4",
    make: "Audi",
    model: "A4",
    year: 2008,
    trim: "S-Line (B7)",
    arrivedDate: "Feb 21, 2026",
    status: "In Yard",
    color: "Dolphin Grey Metallic",
    image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "v5",
    make: "Vauxhall",
    model: "Astra",
    year: 2009,
    trim: "SRi CDTi",
    arrivedDate: "Feb 15, 2026",
    status: "In Yard",
    color: "Flame Red",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "v6",
    make: "Honda",
    model: "Civic",
    year: 2006,
    trim: "Type-R (FN2)",
    arrivedDate: "Feb 10, 2026",
    status: "In Yard",
    color: "Milano Red",
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=600&auto=format&fit=crop"
  }
];

export const mockScrapPrices: ScrapMetalPrice[] = [
  {
    id: "m1",
    category: "Bright Wire (Copper)",
    pricePerKgMin: 4.50,
    pricePerKgMax: 5.20,
    trend: "Rising"
  },
  {
    id: "m2",
    category: "Clean Brass",
    pricePerKgMin: 3.10,
    pricePerKgMax: 3.40,
    trend: "Stable"
  },
  {
    id: "m3",
    category: "Lead Scrap",
    pricePerKgMin: 1.15,
    pricePerKgMax: 1.35,
    trend: "Falling"
  },
  {
    id: "m4",
    category: "Aluminum Extrusions",
    pricePerKgMin: 0.85,
    pricePerKgMax: 1.05,
    trend: "Rising"
  },
  {
    id: "m5",
    category: "Heavy Scrap Iron",
    pricePerKgMin: 0.18,
    pricePerKgMax: 0.24,
    trend: "Rising"
  },
  {
    id: "m6",
    category: "Stainless Steel (304)",
    pricePerKgMin: 1.10,
    pricePerKgMax: 1.25,
    trend: "Stable"
  }
];

export const VEHICLE_MAKES = ["Audi", "BMW", "Ford", "Honda", "Vauxhall", "Volkswagen"];
export const PART_CATEGORIES = [
  "Engine & Gearbox Parts",
  "Body & Panel Parts (Bumper, Doors)",
  "Lighting & Indicators",
  "Suspension & Brakes",
  "Wheels & Tyres",
  "Interior Parts",
  "Electrical & ECU Parts"
];
