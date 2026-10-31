// Auto-generated extended catalog containing 20 new luxury brands and extra items for existing brands.
export interface VariantSeed {
  sku: string;
  name: string;
  size?: string | null;
  price: number;
  compareAt?: number | null;
  stock: number;
  max: number;
}

export interface ProductSeed {
  slug: string;
  name: string;
  brand: string;
  category: string;
  titleLine1: string;
  titleLine2: string;
  accent: string;
  tagline: string;
  badge: string;
  description: string;
  care: string;
  warranty: string;
  returnDays: number;
  hero: string;
  image: string;
  model?: string;
  specs: [string, string][];
  variants: VariantSeed[];
}

export const EXTENDED_PRODUCTS: ProductSeed[] = [
  {
    "slug": "air-jordan-4-retro-bred-reimagined",
    "name": "Air Jordan 4 Retro “Bred Reimagined”",
    "brand": "Jordan",
    "category": "sneakers-footwear",
    "titleLine1": "AIR JORDAN 4",
    "titleLine2": "“BRED REIMAGINED”",
    "accent": "RETRO OG",
    "tagline": "Championship Legacy Reborn in Premium Supple Leather",
    "badge": "ICONIC GRAIL",
    "description": "The silhouette that defined the clutch 1989 playoffs returns elevated. Swapping traditional nubuck for lavish black full-grain leather, complemented by Fire Red and Cement Grey accents, quarter-panel netting, and original Nike Air heel branding.",
    "care": "Condition with leather balm. Store in a cool, dry sneaker vault.",
    "warranty": "Covered by manufacturer warranty against defects.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Silhouette",
        "Mid-Cut Sculpted Aerodynamic Collar"
      ],
      [
        "Upper Material",
        "Premium Tumbled Full-Grain Leather"
      ],
      [
        "Cushioning",
        "Visible Air-Sole Heel Unit"
      ],
      [
        "Hardware",
        "Molded TPU Eyelet Wings & Netting"
      ]
    ],
    "variants": [
      {
        "sku": "AJ4-BRED-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 1929500,
        "compareAt": 2299500,
        "stock": 3,
        "max": 2
      },
      {
        "sku": "AJ4-BRED-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 1929500,
        "compareAt": 2299500,
        "stock": 5,
        "max": 2
      },
      {
        "sku": "AJ4-BRED-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 1929500,
        "compareAt": 2299500,
        "stock": 8,
        "max": 2
      },
      {
        "sku": "AJ4-BRED-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 1929500,
        "compareAt": 2299500,
        "stock": 4,
        "max": 2
      },
      {
        "sku": "AJ4-BRED-UK11",
        "name": "UK 11",
        "size": "UK 11",
        "price": 1929500,
        "compareAt": 2299500,
        "stock": 2,
        "max": 2
      }
    ]
  },
  {
    "slug": "air-jordan-3-retro-white-cement-reimagined",
    "name": "Air Jordan 3 Retro “White Cement Reimagined”",
    "brand": "Jordan",
    "category": "sneakers-footwear",
    "titleLine1": "AIR JORDAN 3",
    "titleLine2": "“WHITE CEMENT”",
    "accent": "1988 REIMAGINED",
    "tagline": "Tinker Hatfield's Architectural Masterpiece with Vintage Patina",
    "badge": "HERITAGE",
    "description": "Honoring the 35th anniversary of Michael Jordan's iconic 1988 Slam Dunk Contest performance. Features exact vintage 1988 specifications, crisp white tumbled leather, authentic elephant print overlays, and aged sail accents.",
    "care": "Spot clean elephant print carefully with soft horsehair brush.",
    "warranty": "Covered by manufacturer warranty against defects.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Designer",
        "Tinker Hatfield 1988 Blueprint"
      ],
      [
        "Print Overlays",
        "Authentic Heavyweight Elephant Print"
      ],
      [
        "Midsole",
        "Aged Pre-Yellowed Polyurethane with Air Unit"
      ],
      [
        "Branding",
        "Classic Nike Air Embossed Heel Counter"
      ]
    ],
    "variants": [
      {
        "sku": "AJ3-WC-UK7.5",
        "name": "UK 7.5",
        "size": "UK 7.5",
        "price": 1839500,
        "compareAt": null,
        "stock": 4,
        "max": 2
      },
      {
        "sku": "AJ3-WC-UK8.5",
        "name": "UK 8.5",
        "size": "UK 8.5",
        "price": 1839500,
        "compareAt": null,
        "stock": 6,
        "max": 2
      },
      {
        "sku": "AJ3-WC-UK9.5",
        "name": "UK 9.5",
        "size": "UK 9.5",
        "price": 1839500,
        "compareAt": null,
        "stock": 7,
        "max": 2
      },
      {
        "sku": "AJ3-WC-UK10.5",
        "name": "UK 10.5",
        "size": "UK 10.5",
        "price": 1839500,
        "compareAt": null,
        "stock": 3,
        "max": 2
      }
    ]
  },
  {
    "slug": "air-jordan-11-retro-gratitude-dmp",
    "name": "Air Jordan 11 Retro “Gratitude” DMP",
    "brand": "Jordan",
    "category": "sneakers-footwear",
    "titleLine1": "AIR JORDAN 11",
    "titleLine2": "“GRATITUDE”",
    "accent": "DEFINING MOMENTS",
    "tagline": "Tuxedo Luxury Engineered for Hardwood Dominance",
    "badge": "LIMITED EDITION",
    "description": "A profound expression of gratitude to the global basketball community. Combining mirror-shine jet black patent leather with rich white tumbled leather, metallic gold Jumpman medallions, and an icy translucent milky outsole.",
    "care": "Polish patent rand with microfiber cloth. Avoid sharp scuffs.",
    "warranty": "Covered by manufacturer warranty against defects.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Rand",
        "Extended High-Gloss Patent Leather Guard"
      ],
      [
        "Upper",
        "Lustrous Tumbled Leather Replacing Mesh"
      ],
      [
        "Shank Plate",
        "Full-Length Carbon Fiber Torsional Shank"
      ],
      [
        "Emblem",
        "Forged Metallic Gold Jumpman Casting"
      ]
    ],
    "variants": [
      {
        "sku": "AJ11-GRAT-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 2099500,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "AJ11-GRAT-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 2099500,
        "compareAt": null,
        "stock": 6,
        "max": 1
      },
      {
        "sku": "AJ11-GRAT-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 2099500,
        "compareAt": null,
        "stock": 5,
        "max": 1
      },
      {
        "sku": "AJ11-GRAT-UK11",
        "name": "UK 11",
        "size": "UK 11",
        "price": 2099500,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "air-jordan-1-retro-high-lost-and-found",
    "name": "Air Jordan 1 Retro High OG “Lost & Found Chicago”",
    "brand": "Jordan",
    "category": "sneakers-footwear",
    "titleLine1": "AIR JORDAN 1",
    "titleLine2": "“LOST & FOUND”",
    "accent": "CHICAGO 1985",
    "tagline": "The Holy Grail Chicago Silhouette Found in Vintage Vaults",
    "badge": "EDITORIAL CHOICE",
    "description": "Paying homage to mom-and-pop shoe boutiques of the 1980s. Designed with cracked leather ankle collars, aged musing midsoles, vibrant Varsity Red paneling, and period-correct vintage receipt packaging.",
    "care": "Store in climate-controlled conditions with original packaging.",
    "warranty": "Covered by manufacturer warranty against defects.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Colorway",
        "Varsity Red / Black / Sail / Muslin"
      ],
      [
        "Leather Detail",
        "Cracked Leather Collar & Distressed Texture"
      ],
      [
        "Collar Shape",
        "Authentic 1985 High-Profile Ankle Cut"
      ],
      [
        "Sole",
        "Heritage Rubber Cupsole with Encapsulated Air"
      ]
    ],
    "variants": [
      {
        "sku": "AJ1-LNF-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 1749500,
        "compareAt": 1999500,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "AJ1-LNF-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 1749500,
        "compareAt": 1999500,
        "stock": 4,
        "max": 1
      },
      {
        "sku": "AJ1-LNF-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 1749500,
        "compareAt": 1999500,
        "stock": 5,
        "max": 1
      },
      {
        "sku": "AJ1-LNF-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 1749500,
        "compareAt": 1999500,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "travis-scott-air-jordan-1-low-og-canary",
    "name": "Travis Scott x Air Jordan 1 Low OG “Canary”",
    "brand": "Jordan",
    "category": "sneakers-footwear",
    "titleLine1": "TRAVIS SCOTT",
    "titleLine2": "“CANARY”",
    "accent": "CACTUS JACK LOW",
    "tagline": "High-Voltage Houston Aesthetic with Signature Reverse Swoosh",
    "badge": "TOP RATED",
    "description": "Inspired by Travis Scott's Lawrence E. Elkins High School colors. Crafted from Canary Yellow and Light Silver leather with Racer Blue accents, featuring the unmistakable oversized reverse leather Swoosh and Cactus Jack heel embroidery.",
    "care": "Wipe gently with damp cloth. Store away from direct sunlight.",
    "warranty": "Covered by manufacturer warranty against defects.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Collaboration",
        "Cactus Jack x Jordan Brand Special Project"
      ],
      [
        "Insignia",
        "Signature Inverted Lateral Leather Swoosh"
      ],
      [
        "Accents",
        "Embroidered Cactus Jack Face & Wings Logos"
      ],
      [
        "Outsole",
        "Gum Light Brown Traction Tread Pattern"
      ]
    ],
    "variants": [
      {
        "sku": "TS-AJ1-CAN-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 4499900,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "TS-AJ1-CAN-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 4499900,
        "compareAt": null,
        "stock": 3,
        "max": 1
      },
      {
        "sku": "TS-AJ1-CAN-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 4499900,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "patek-philippe-aquanaut-5167a-stainless-steel",
    "name": "Patek Philippe Aquanaut 5167A-001",
    "brand": "Patek Philippe",
    "category": "watches-accessories",
    "titleLine1": "AQUANAUT",
    "titleLine2": "“5167A-001”",
    "accent": "SPORT CHIC",
    "tagline": "Modern Dynamic Haute Horlogerie with Tropical Composite Strap",
    "badge": "HAUTE HORLOGERIE",
    "description": "Launched in 1997, the Aquanaut created a sensation with its modern, unexpected design. Featuring a rounded octagonal stainless steel case, black embossed dial matching the ultra-resistant composite strap, and self-winding Calibre 26-330 S C.",
    "care": "Clean with freshwater after swimming. Service every 3-5 years.",
    "warranty": "Patek Philippe International Certificate of Origin & Warranty.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1620625515032-6ed0c1790c75?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1620625515032-6ed0c1790c75?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Calibre",
        "26-330 S C Mechanical Self-Winding"
      ],
      [
        "Case",
        "40.8mm Stainless Steel (Height 8.1mm)"
      ],
      [
        "Dial",
        "Black Embossed with Gold Applied Numerals"
      ],
      [
        "Water Resistance",
        "120m Screw-Down Crown"
      ]
    ],
    "variants": [
      {
        "sku": "PP-5167A",
        "name": "Steel / Black Tropical",
        "price": 245000000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "patek-philippe-grand-complications-5270p-platinum",
    "name": "Patek Philippe Grand Complications 5270P Perpetual Calendar",
    "brand": "Patek Philippe",
    "category": "watches-accessories",
    "titleLine1": "GRAND COMPLICATIONS",
    "titleLine2": "“5270P PLATINUM”",
    "accent": "PERPETUAL CHRONO",
    "tagline": "The Summit of Genevan Watchmaking Artistry with Emerald Green Dial",
    "badge": "FLAGSHIP",
    "description": "The heir to a legendary grand complication chronograph lineage. Encased in solid 950 platinum with a diamond set between the lower lugs, featuring a radiant green sunburst dial with black-gradient rim and the manufacture CH 29-535 PS Q calibre.",
    "care": "Hand-wind regularly. Store in a dedicated temperature-stable winder.",
    "warranty": "Patek Philippe Master Watchmaker Certificate of Guarantee.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Calibre",
        "CH 29-535 PS Q Manual-Wind Perpetual Chrono"
      ],
      [
        "Case",
        "41mm Solid 950 Platinum with Top Wesselton Diamond"
      ],
      [
        "Dial",
        "Lacquered Green Sunburst with Black Gradient"
      ],
      [
        "Strap",
        "Shiny Black Alligator with Platinum Fold-Over Clasp"
      ]
    ],
    "variants": [
      {
        "sku": "PP-5270P-GREEN",
        "name": "Platinum / Green",
        "price": 1950000000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "patek-philippe-calatrava-5227r-rose-gold",
    "name": "Patek Philippe Calatrava 5227R-001 Rose Gold",
    "brand": "Patek Philippe",
    "category": "watches-accessories",
    "titleLine1": "CALATRAVA",
    "titleLine2": "“5227R OFFICER”",
    "accent": "ROSE GOLD",
    "tagline": "Timeless Pure Round Elegance with Secret Officer's Caseback",
    "badge": "HERITAGE",
    "description": "With its pure lines, the Calatrava is the supreme archetype of the round wristwatch. Cased in 18K rose gold with fluted lugs and an invisible hinged dust cover protecting the sapphire crystal exhibition back, revealing Calibre 324 S C.",
    "care": "Keep away from perfumes and solvents. Service only via authorized salon.",
    "warranty": "Patek Philippe International Certificate of Origin & Warranty.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Calibre",
        "324 S C Automatic with 21K Gold Rotor"
      ],
      [
        "Case",
        "39mm Solid 18K Rose Gold with Officer's Hinged Cover"
      ],
      [
        "Dial",
        "Ivory Lacquered with Gold Applied Faceted Markers"
      ],
      [
        "Power Reserve",
        "Up to 45 Hours Constant Amplitude"
      ]
    ],
    "variants": [
      {
        "sku": "PP-5227R-IVO",
        "name": "Rose Gold / Ivory",
        "price": 362000000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "patek-philippe-nautilus-5711-1a-tiffany-blue",
    "name": "Patek Philippe Nautilus 5711/1A “Tiffany & Co.” Edition",
    "brand": "Patek Philippe",
    "category": "watches-accessories",
    "titleLine1": "NAUTILUS",
    "titleLine2": "“TIFFANY BLUE”",
    "accent": "5711/1A-018",
    "tagline": "The Most Coveted Contemporary Horological Trophy in History",
    "badge": "LIMITED EDITION",
    "description": "Created in a strictly limited edition celebrating the 170-year partnership between Patek Philippe and Tiffany & Co. Sports an unforgettable cyan Tiffany Blue dial stamped with the Tiffany dual hallmark, encapsulated in iconic satin-brushed steel.",
    "care": "Store in vault conditions. Full archival documentation included.",
    "warranty": "Full Patek Philippe & Tiffany & Co. Dual Provenance Certificate.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Edition",
        "Commemorative 170th Anniversary Dual-Signed"
      ],
      [
        "Case & Bracelet",
        "40mm Hand-Finished Stainless Steel"
      ],
      [
        "Dial",
        "Official Tiffany Blue with Dual Stamped Insignia"
      ],
      [
        "Movement",
        "Calibre 26-330 S C with Stop-Seconds"
      ]
    ],
    "variants": [
      {
        "sku": "PP-5711-TIFFANY",
        "name": "Steel / Tiffany Dial",
        "price": 3200000000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "patek-philippe-aquanaut-chronograph-5968g-white-gold",
    "name": "Patek Philippe Aquanaut Chronograph 5968G White Gold",
    "brand": "Patek Philippe",
    "category": "watches-accessories",
    "titleLine1": "AQUANAUT",
    "titleLine2": "“CHRONOGRAPH”",
    "accent": "5968G WHITE GOLD",
    "tagline": "Bold Sophisticated High-Performance Self-Winding Chronograph",
    "badge": "TOP RATED",
    "description": "Dressed in luminous 18K white gold with a striking midnight blue dial shaded with a subtle black-gradient perimeter. Equipped with the flyback chronograph Calibre CH 28-520 C, allowing instantaneous resetting while running.",
    "care": "Rinse with lukewarm water after marine use.",
    "warranty": "Patek Philippe International Certificate of Origin & Warranty.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Calibre",
        "CH 28-520 C Column-Wheel Flyback Chronograph"
      ],
      [
        "Case",
        "42.2mm Solid 18K White Gold (Height 11.9mm)"
      ],
      [
        "Dial",
        "Midnight Blue with Black Gradient Sunburst"
      ],
      [
        "Straps Included",
        "Midnight Blue and Black Integrated Composite"
      ]
    ],
    "variants": [
      {
        "sku": "PP-5968G-BLUE",
        "name": "White Gold / Blue",
        "price": 650000000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "armani-exchange-milano-slim-fit-wool-suit",
    "name": "Armani Exchange Milano Slim-Fit Wool Suit",
    "brand": "Armani Exchange",
    "category": "fashion",
    "titleLine1": "ARMANI EX.",
    "titleLine2": "“MILANO SUIT”",
    "accent": "SLIM FIT",
    "tagline": "Contemporary Italian Tailoring Crafted from Stretch Virgin Wool",
    "badge": "EDITORIAL CHOICE",
    "description": "Sharp contemporary tailoring tailored in Italy. Built from an ultra-breathable stretch virgin wool blend with sleek notched lapels, two-button silhouette, matching flat-front tapered trousers, and signature silken monogram interior lining.",
    "care": "Dry clean only. Hang on wide contoured wooden suit hanger.",
    "warranty": "Armani Exchange authenticity guarantee.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Material",
        "96% Virgin Wool, 4% Elastane Comfort Stretch"
      ],
      [
        "Jacket Cut",
        "Modern Slim Notch Lapel Two-Button Structure"
      ],
      [
        "Trousers",
        "Flat-Front Tapered Ankle Cut with Gripper Waistband"
      ],
      [
        "Origin",
        "Designed in Milan, Italy"
      ]
    ],
    "variants": [
      {
        "sku": "AX-SUIT-38R",
        "name": "38R",
        "size": "38R",
        "price": 3999900,
        "compareAt": 4599900,
        "stock": 3,
        "max": 2
      },
      {
        "sku": "AX-SUIT-40R",
        "name": "40R",
        "size": "40R",
        "price": 3999900,
        "compareAt": 4599900,
        "stock": 6,
        "max": 2
      },
      {
        "sku": "AX-SUIT-42R",
        "name": "42R",
        "size": "42R",
        "price": 3999900,
        "compareAt": 4599900,
        "stock": 6,
        "max": 2
      },
      {
        "sku": "AX-SUIT-44R",
        "name": "44R",
        "size": "44R",
        "price": 3999900,
        "compareAt": 4599900,
        "stock": 2,
        "max": 2
      }
    ]
  },
  {
    "slug": "armani-exchange-monogram-quilted-puffer",
    "name": "Armani Exchange Monogram Quilted Puffer Jacket",
    "brand": "Armani Exchange",
    "category": "fashion",
    "titleLine1": "ARMANI EX.",
    "titleLine2": "“MONOGRAM”",
    "accent": "QUILTED PUFFER",
    "tagline": "High-Gloss Thermal Insulation with All-Over Debossed Monogram",
    "badge": "NEW ARRIVAL",
    "description": "An urban cold-weather armor piece. Engineered from glossy water-repellent ciré nylon filled with high-loft synthetic down for lightweight warmth. Features all-over tonal A|X monogram quilting, storm placket, and detachable insulated hood.",
    "care": "Machine wash cold delicate. Do not bleach. Air dry flat.",
    "warranty": "Armani Exchange authenticity guarantee.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Shell",
        "Water-Repellent Gloss High-Density Ciré Nylon"
      ],
      [
        "Insulation",
        "Recycled High-Loft Thermal Micro-Fill"
      ],
      [
        "Hood",
        "Detachable Hood with Adjustable Toggle Bungee"
      ],
      [
        "Pockets",
        "Dual Fleece-Lined Zippered Handwarmers"
      ]
    ],
    "variants": [
      {
        "sku": "AX-PUFF-S",
        "name": "S",
        "size": "S",
        "price": 2249900,
        "compareAt": 2699900,
        "stock": 4,
        "max": 3
      },
      {
        "sku": "AX-PUFF-M",
        "name": "M",
        "size": "M",
        "price": 2249900,
        "compareAt": 2699900,
        "stock": 8,
        "max": 3
      },
      {
        "sku": "AX-PUFF-L",
        "name": "L",
        "size": "L",
        "price": 2249900,
        "compareAt": 2699900,
        "stock": 8,
        "max": 3
      },
      {
        "sku": "AX-PUFF-XL",
        "name": "XL",
        "size": "XL",
        "price": 2249900,
        "compareAt": 2699900,
        "stock": 3,
        "max": 3
      }
    ]
  },
  {
    "slug": "armani-exchange-technical-runner-sneaker",
    "name": "Armani Exchange Technical Runner Sneaker",
    "brand": "Armani Exchange",
    "category": "sneakers-footwear",
    "titleLine1": "ARMANI EX.",
    "titleLine2": "“RUNNER”",
    "accent": "TECHNICAL KNIT",
    "tagline": "Dynamic Milanese Street Runner with Sculpted Chunky Sole",
    "badge": "TOP RATED",
    "description": "Italian streetwear energy meets athletic comfort. Crafted from technical mesh, bonded suede accents, and TPU overlays. Sitting on a futuristic sculpted EVA midsole that absorbs stride impact with bold A|X lateral branding.",
    "care": "Wipe with damp cloth and mild sneaker cleaner.",
    "warranty": "Armani Exchange authenticity guarantee.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Upper",
        "Multi-Panel Breathable Technical Mesh & Micro-Suede"
      ],
      [
        "Midsole",
        "Sculpted High-Rebound EVA Shock Absorption"
      ],
      [
        "Sole",
        "Two-Tone Geometric Rubber Traction Tread"
      ],
      [
        "Insole",
        "Removable Ergonomic Memory Cushion Footbed"
      ]
    ],
    "variants": [
      {
        "sku": "AX-SNEAK-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 1499900,
        "compareAt": null,
        "stock": 3,
        "max": 2
      },
      {
        "sku": "AX-SNEAK-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 1499900,
        "compareAt": null,
        "stock": 7,
        "max": 2
      },
      {
        "sku": "AX-SNEAK-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 1499900,
        "compareAt": null,
        "stock": 6,
        "max": 2
      },
      {
        "sku": "AX-SNEAK-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 1499900,
        "compareAt": null,
        "stock": 2,
        "max": 2
      }
    ]
  },
  {
    "slug": "armani-exchange-hampton-chronograph-watch-ax2104",
    "name": "Armani Exchange Hampton Chronograph Watch AX2104",
    "brand": "Armani Exchange",
    "category": "watches-accessories",
    "titleLine1": "ARMANI EX.",
    "titleLine2": "“HAMPTON”",
    "accent": "AX2104 CHRONO",
    "tagline": "Monochromatic All-Black PVD Stainless Steel Statement",
    "badge": "EDITORIAL CHOICE",
    "description": "The commanding Hampton chronograph features a bold 46mm black ion-plated stainless steel case with textured sunray dial, baton indexes, date display window, and a three-link black stainless steel bracelet with push-button deployment.",
    "care": "Wipe with soft jewelers cloth. Water resistant up to 50 meters.",
    "warranty": "2-year manufacturer international warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Movement",
        "High-Precision Japanese Quartz Chronograph"
      ],
      [
        "Case Size",
        "46mm Ionic Plated Black Stainless Steel"
      ],
      [
        "Dial",
        "Black Textured Sunray with Polished Stick Indices"
      ],
      [
        "Water Resistance",
        "50m / 5 ATM Splash Resistant"
      ]
    ],
    "variants": [
      {
        "sku": "AX-2104-BLK",
        "name": "Black PVD Steel",
        "price": 1649500,
        "compareAt": null,
        "stock": 9,
        "max": 2
      }
    ]
  },
  {
    "slug": "armani-exchange-contrast-tipped-pique-polo",
    "name": "Armani Exchange Contrast Tipped Piqué Polo",
    "brand": "Armani Exchange",
    "category": "fashion",
    "titleLine1": "ARMANI EX.",
    "titleLine2": "“PIQUÉ POLO”",
    "accent": "STRETCH COTTON",
    "tagline": "Refined Casual Essential with Dual-Tone Collar Tipping",
    "badge": "NEW ARRIVAL",
    "description": "The foundation of warm-weather Milanese elegance. Spun from ultra-soft pima cotton piqué infused with stretch for flexible shape retention. Finished with striped ribbed collar tipping and rubberized A|X chest emblem.",
    "care": "Machine wash cold inside out with like colors. Do not tumble dry.",
    "warranty": "Armani Exchange authenticity guarantee.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Fabric",
        "95% Pima Cotton Piqué, 5% Elastane"
      ],
      [
        "Collar",
        "Ribbed Contrast Striped Tipped Collar & Cuffs"
      ],
      [
        "Placket",
        "Three-Button Placket with Engraved A|X Buttons"
      ],
      [
        "Cut",
        "Slim Tapered Athletic Silhouette"
      ]
    ],
    "variants": [
      {
        "sku": "AX-POLO-S",
        "name": "S",
        "size": "S",
        "price": 799900,
        "compareAt": 999900,
        "stock": 6,
        "max": 4
      },
      {
        "sku": "AX-POLO-M",
        "name": "M",
        "size": "M",
        "price": 799900,
        "compareAt": 999900,
        "stock": 12,
        "max": 4
      },
      {
        "sku": "AX-POLO-L",
        "name": "L",
        "size": "L",
        "price": 799900,
        "compareAt": 999900,
        "stock": 10,
        "max": 4
      },
      {
        "sku": "AX-POLO-XL",
        "name": "XL",
        "size": "XL",
        "price": 799900,
        "compareAt": 999900,
        "stock": 4,
        "max": 4
      }
    ]
  },
  {
    "slug": "asus-rog-zephyrus-g16-oled-rtx4090",
    "name": "ASUS ROG Zephyrus G16 OLED (Core Ultra 9 / RTX 4090)",
    "brand": "ASUS",
    "category": "electronics-gadgets",
    "titleLine1": "ROG ZEPHYRUS",
    "titleLine2": "“G16 OLED”",
    "accent": "RTX 4090",
    "tagline": "CNC Aluminum Masterpiece with 2.5K 240Hz ROG Nebula OLED",
    "badge": "FLAGSHIP",
    "description": "The pinnacle of ultraportable gaming craftsmanship. Precision-milled CNC unibody chassis packing an Intel Core Ultra 9 185H processor, NVIDIA GeForce RTX 4090 graphics, vapor chamber cooling, and Slash Lighting array on the lid.",
    "care": "Keep air intakes clear. Use supplied 240W charging brick for maximum TGP.",
    "warranty": "1-year international manufacturer warranty + accidental damage protection.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Processor",
        "Intel Core Ultra 9 185H (16C/22T, NPU AI Engine)"
      ],
      [
        "Graphics",
        "NVIDIA GeForce RTX 4090 16GB GDDR6 (115W TGP)"
      ],
      [
        "Display",
        "16\" 2.5K 240Hz 0.2ms ROG Nebula OLED (100% DCI-P3)"
      ],
      [
        "Memory & Storage",
        "32GB LPDDR5X-7467MHz + 2TB PCIe 4.0 NVMe SSD"
      ]
    ],
    "variants": [
      {
        "sku": "ASUS-ROG-G16-4090",
        "name": "32GB / 2TB SSD / RTX 4090",
        "price": 32999000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      }
    ]
  },
  {
    "slug": "asus-rog-ally-x-handheld-gaming-console",
    "name": "ASUS ROG Ally X Handheld Console",
    "brand": "ASUS",
    "category": "electronics-gadgets",
    "titleLine1": "ROG ALLY X",
    "titleLine2": "“HANDHELD”",
    "accent": "Z1 EXTREME",
    "tagline": "Doubled Battery, 24GB LPDDR5X RAM, and Upgraded Ergonomics",
    "badge": "TOP RATED",
    "description": "The definitive Windows 11 handheld gaming computer. Powered by AMD Ryzen Z1 Extreme, now engineered with an immense 80Wh battery, 24GB high-speed memory, dual USB-C ports with Thunderbolt 4 support, and redesigned tactile grips.",
    "care": "Charge with USB-PD 65W+ chargers. Keep vents dust-free.",
    "warranty": "1-year ASUS official warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Processor",
        "AMD Ryzen Z1 Extreme (8C/16T, RDNA 3 Graphics)"
      ],
      [
        "Battery",
        "80Wh High-Capacity Li-Ion (Doubled Runtime)"
      ],
      [
        "RAM & Storage",
        "24GB LPDDR5X-7500 + 1TB M.2 2280 NVMe SSD"
      ],
      [
        "Display",
        "7\" 1080p 120Hz 500-Nit IPS with AMD FreeSync Premium"
      ]
    ],
    "variants": [
      {
        "sku": "ASUS-ALLY-X-1TB",
        "name": "24GB / 1TB SSD",
        "price": 8999000,
        "compareAt": 9999000,
        "stock": 8,
        "max": 2
      }
    ]
  },
  {
    "slug": "asus-proart-studiobook-16-oled-workstation",
    "name": "ASUS ProArt Studiobook 16 OLED Workstation",
    "brand": "ASUS",
    "category": "electronics-gadgets",
    "titleLine1": "PROART",
    "titleLine2": "“STUDIOBOOK 16”",
    "accent": "OLED PRO",
    "tagline": "Color-Accurate Workstation with Physical ASUS Dial Control",
    "badge": "EDITORIAL CHOICE",
    "description": "Designed for world-class creators, visual effects artists, and filmmakers. Boasting a factory-calibrated 3.2K 120Hz OLED touchscreen with Delta E < 1 color precision, physical rotary ASUS Dial for Adobe Suite integration, and NVIDIA RTX workstation graphics.",
    "care": "Wipe OLED display with microfiber cloth only. Avoid screen burn-in tools.",
    "warranty": "2-year ASUS on-site premium business warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Processor",
        "Intel Core i9-13980HX (24C/32T, up to 5.6GHz)"
      ],
      [
        "Display",
        "16\" 3.2K 120Hz 16:10 OLED Touchscreen (Calman Verified)"
      ],
      [
        "Interface",
        "Physical Rotary ASUS Dial for Premiere/Photoshop"
      ],
      [
        "Cooling",
        "IceCool Pro Thermal System with Liquid Metal"
      ]
    ],
    "variants": [
      {
        "sku": "ASUS-PROART-16-OLED",
        "name": "32GB / 1TB SSD / RTX 4070",
        "price": 21999000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      }
    ]
  },
  {
    "slug": "asus-rog-swift-oled-pg32ucdm-gaming-monitor",
    "name": "ASUS ROG Swift OLED PG32UCDM 32” 4K 240Hz Monitor",
    "brand": "ASUS",
    "category": "electronics-gadgets",
    "titleLine1": "ROG SWIFT",
    "titleLine2": "“PG32UCDM”",
    "accent": "4K 240HZ QD-OLED",
    "tagline": "The World's Preeminent 32-Inch 4K 240Hz QD-OLED Battlefield Display",
    "badge": "FLAGSHIP",
    "description": "A seismic leap in visual fidelity. 3rd-generation QD-OLED technology delivers pristine 4K UHD clarity, blistering 240Hz refresh rate, 0.03ms response time, custom graphene heatsink passive cooling, and 99% DCI-P3 color gamut.",
    "care": "Pixel clean utility runs automatically in standby. Do not apply liquid to screen.",
    "warranty": "3-year warranty including OLED burn-in coverage.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Panel",
        "31.5\" 4K UHD (3840x2160) 3rd Gen QD-OLED"
      ],
      [
        "Performance",
        "240Hz Refresh Rate, 0.03ms (GTG) Response"
      ],
      [
        "Thermal",
        "Custom Passive Heatsink with Graphene Film"
      ],
      [
        "Ports",
        "DisplayPort 1.4 DSC, HDMI 2.1, USB-C 90W Power Delivery"
      ]
    ],
    "variants": [
      {
        "sku": "ASUS-PG32UCDM-4K",
        "name": "32\" QD-OLED 4K 240Hz",
        "price": 13499900,
        "compareAt": null,
        "stock": 5,
        "max": 1
      }
    ]
  },
  {
    "slug": "asus-zenbook-duo-dual-oled-laptop",
    "name": "ASUS Zenbook Duo Dual 14” 3K OLED Laptop",
    "brand": "ASUS",
    "category": "electronics-gadgets",
    "titleLine1": "ZENBOOK DUO",
    "titleLine2": "“DUAL OLED”",
    "accent": "3K 120HZ",
    "tagline": "Dual 14-Inch Full-Size 3K OLED Touchscreens with Detachable Keyboard",
    "badge": "NEW ARRIVAL",
    "description": "Multi-tasking reimagined without compromise. Dual 14-inch 3K 120Hz ASUS Lumina OLED touchscreens provide up to 19.8 inches of visual workspace in an ultra-sleek 1.35kg form factor, powered by Intel Core Ultra 9 with dedicated AI NPU.",
    "care": "Dock keyboard carefully onto pogo pin magnetic connectors.",
    "warranty": "1-year international manufacturer warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Screens",
        "Dual 14\" 3K (2880x1800) 120Hz OLED Touch (500 Nits)"
      ],
      [
        "Processor",
        "Intel Core Ultra 9 185H with Intel AI Boost"
      ],
      [
        "Weight",
        "Ultra-Slim 1.35kg All-Metal Magnesium Alloy"
      ],
      [
        "Keyboard",
        "Full-Size Detachable Bluetooth Keyboard with Touchpad"
      ]
    ],
    "variants": [
      {
        "sku": "ASUS-ZENBOOK-DUO-OLED",
        "name": "32GB / 1TB SSD / Dual OLED",
        "price": 15999000,
        "compareAt": 17999000,
        "stock": 6,
        "max": 1
      }
    ]
  },
  {
    "slug": "rolex-submariner-date-126610ln-oystersteel",
    "name": "Rolex Submariner Date 126610LN Oystersteel",
    "brand": "Rolex",
    "category": "watches-accessories",
    "titleLine1": "ROLEX",
    "titleLine2": "“SUBMARINER DATE”",
    "accent": "126610LN",
    "tagline": "The Benchmark of Diving Watches in Corrosion-Resistant Oystersteel",
    "badge": "ICONIC GRAIL",
    "description": "The reference among divers' watches since 1953. Forged in Rolex's proprietary Oystersteel with an unscratchable Cerachrom ceramic bezel insert in black, intense black dial with Chromalight display, and manufacture Calibre 3235.",
    "care": "Rinse with freshwater after saltwater dives. Service interval 10 years.",
    "warranty": "5-year official international Rolex guarantee.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Calibre",
        "Rolex Manufacture 3235 Perpetual Self-Winding"
      ],
      [
        "Case & Bezel",
        "41mm Oystersteel with Unidirectional Cerachrom Bezel"
      ],
      [
        "Water Resistance",
        "300 meters / 1,000 feet with Triplock Crown"
      ],
      [
        "Bracelet",
        "Oyster Three-Piece Solid Links with Glidelock Clasp"
      ]
    ],
    "variants": [
      {
        "sku": "ROL-126610LN",
        "name": "Oystersteel / Black",
        "price": 115700000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      }
    ]
  },
  {
    "slug": "rolex-cosmograph-daytona-126500ln-panda",
    "name": "Rolex Cosmograph Daytona 126500LN White “Panda”",
    "brand": "Rolex",
    "category": "watches-accessories",
    "titleLine1": "COSMOGRAPH",
    "titleLine2": "“DAYTONA”",
    "accent": "126500LN PANDA",
    "tagline": "The Ultimate Racing Driver's Tool Watch with Cerachrom Tachymeter",
    "badge": "HAUTE HORLOGERIE",
    "description": "Born on the racetrack of Daytona Beach. Featuring the iconic high-contrast white lacquer dial with black snail counters, monobloc black Cerachrom bezel with tachymetric scale edged in steel, and state-of-the-art Calibre 4131.",
    "care": "Keep chronograph screw-down pushers securely tightened when in water.",
    "warranty": "5-year official international Rolex guarantee.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1620625515032-6ed0c1790c75?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1620625515032-6ed0c1790c75?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Calibre",
        "Rolex 4131 Chronograph with Chronergy Escapement"
      ],
      [
        "Case",
        "40mm Oystersteel with Polished Lugs and Flanks"
      ],
      [
        "Dial",
        "White Gloss Lacquer with Snailed Azure Subdials"
      ],
      [
        "Power Reserve",
        "Approximately 72 Hours Constant Amplitude"
      ]
    ],
    "variants": [
      {
        "sku": "ROL-126500LN-W",
        "name": "Oystersteel / White Panda",
        "price": 142000000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "rolex-gmt-master-ii-126710blro-pepsi",
    "name": "Rolex GMT-Master II 126710BLRO “Pepsi” Jubilee",
    "brand": "Rolex",
    "category": "watches-accessories",
    "titleLine1": "GMT-MASTER II",
    "titleLine2": "“PEPSI JUBILEE”",
    "accent": "126710BLRO",
    "tagline": "Dual Timezone Aviator Instrument with Red & Blue Ceramic Bezel",
    "badge": "TOP RATED",
    "description": "Designed for international airline pilots in the dawn of transcontinental flight. Displays two distinct time zones simultaneously via the 24-hour red and blue Cerachrom ceramic bezel and independent 24-hour red GMT hand, draped on a supple five-link Jubilee bracelet.",
    "care": "Clean with mild soapy water and soft brush. Dry with microfiber cloth.",
    "warranty": "5-year official international Rolex guarantee.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1522273400909-fd1a8f77637e?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1522273400909-fd1a8f77637e?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Dual Timezone",
        "Independent 24-Hour Hand with Bidirectional Bezel"
      ],
      [
        "Bezel Insert",
        "Two-Color Red & Blue Ceramic Cerachrom"
      ],
      [
        "Bracelet",
        "Jubilee Five-Piece Links with Oysterlock Safety Clasp"
      ],
      [
        "Movement",
        "Calibre 3285 Superlative Chronometer (-2/+2 sec/day)"
      ]
    ],
    "variants": [
      {
        "sku": "ROL-126710BLRO",
        "name": "Oystersteel / Jubilee",
        "price": 102500000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "rolex-datejust-41-fluted-jubilee-bright-blue",
    "name": "Rolex Datejust 41 Fluted Bezel Jubilee Bright Blue",
    "brand": "Rolex",
    "category": "watches-accessories",
    "titleLine1": "DATEJUST 41",
    "titleLine2": "“BRIGHT BLUE”",
    "accent": "WHITE ROLESOR",
    "tagline": "The Archetype of Classic Horology with 18K White Gold Fluted Bezel",
    "badge": "EDITORIAL CHOICE",
    "description": "The classic Rolex date watch par excellence. Adorned with an 18K white gold fluted bezel that captures light with hypnotic scintillation, shimmering sunray bright blue dial, Cyclops date magnification lens, and comfortable Jubilee bracelet.",
    "care": "Polish fluted bezel gently. Service every 10 years at Rolex center.",
    "warranty": "5-year official international Rolex guarantee.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Material",
        "White Rolesor (Oystersteel & 18K White Gold)"
      ],
      [
        "Bezel",
        "Iconic Fluted 18K White Gold Bezel Ring"
      ],
      [
        "Dial",
        "Bright Blue Sunray Finish with 18K Gold Chromalight Markers"
      ],
      [
        "Lens",
        "Cyclops Lens Over Instantaneous Date Display"
      ]
    ],
    "variants": [
      {
        "sku": "ROL-126334-BLU",
        "name": "Rolesor / Blue Jubilee",
        "price": 98000000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      }
    ]
  },
  {
    "slug": "rolex-day-date-40-platinum-ice-blue-dial",
    "name": "Rolex Day-Date 40 Platinum President Ice Blue Dial",
    "brand": "Rolex",
    "category": "watches-accessories",
    "titleLine1": "DAY-DATE 40",
    "titleLine2": "“PRESIDENT”",
    "accent": "SOLID 950 PLATINUM",
    "tagline": "The Ultimate Watch of Prestige Worn by Visionaries and World Leaders",
    "badge": "FLAGSHIP",
    "description": "Worn by presidents, luminaries, and captains of industry. Crafted exclusively in noble 950 platinum with the signature ice blue dial reserved only for platinum Rolex timepieces, fluted platinum bezel, and the iconic three-piece semicircular link President bracelet.",
    "care": "Handle with white gloves. Store in secure vault winder.",
    "warranty": "5-year official international Rolex guarantee.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Precious Metal",
        "Solid 950 Platinum Case & President Bracelet"
      ],
      [
        "Exclusive Dial",
        "Ice Blue Diagonal Motif Dial with Roman Numerals"
      ],
      [
        "Calendar",
        "Instantaneous Day of Week Spelled in Full + Date"
      ],
      [
        "Calibre",
        "Rolex Manufacture 3255 with 14 Patents"
      ]
    ],
    "variants": [
      {
        "sku": "ROL-228236-ICE",
        "name": "950 Platinum / Ice Blue",
        "price": 585000000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "rolex-oyster-perpetual-41-celebration-motif",
    "name": "Rolex Oyster Perpetual 41 “Celebration Motif”",
    "brand": "Rolex",
    "category": "watches-accessories",
    "titleLine1": "OYSTER PERP.",
    "titleLine2": "“CELEBRATION”",
    "accent": "BUBBLE MOTIF",
    "tagline": "Vibrant Jubilant Palette Encapsulating 5 Lacquered Dial Colors",
    "badge": "LIMITED EDITION",
    "description": "A joyful artistic celebration of color. The turquoise celebration dial unites bubbles of candy pink, yellow, coral red, and green against a turquoise blue sky, encased in 41mm satin-finished Oystersteel powered by Calibre 3230.",
    "care": "Wipe with soft jewelers cloth. Water resistant to 100 meters.",
    "warranty": "5-year official international Rolex guarantee.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Dial Artwork",
        "Celebration Motif Lacquered Multicolor Bubbles"
      ],
      [
        "Case",
        "41mm Oystersteel with Domed Smooth Bezel"
      ],
      [
        "Water Resistance",
        "100m / 330ft Twinlock Waterproofness"
      ],
      [
        "Bracelet",
        "Oyster Solid Links with Easylink 5mm Comfort Extension"
      ]
    ],
    "variants": [
      {
        "sku": "ROL-124300-CEL",
        "name": "Oystersteel / Celebration",
        "price": 58000000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "audemars-piguet-royal-oak-jumbo-16202st",
    "name": "Audemars Piguet Royal Oak “Jumbo” Extra-Thin 16202ST",
    "brand": "Audemars Piguet",
    "category": "watches-accessories",
    "titleLine1": "ROYAL OAK",
    "titleLine2": "“JUMBO 16202ST”",
    "accent": "EXTRA-THIN",
    "tagline": "Gérald Genta's 1972 Masterwork with Bleu Nuit Petite Tapisserie",
    "badge": "HAUTE HORLOGERIE",
    "description": "Celebrating five decades of an icon that broke all the rules in 1972. Featuring the legendary 39mm octagonal bezel with eight exposed hexagonal white gold screws, Bleu Nuit Nuage 50 Petite Tapisserie guilloché dial, and ultra-thin Calibre 7121.",
    "care": "Protect satin-brushed bezel edges from sharp knocks. Service every 4 years.",
    "warranty": "Audemars Piguet 5-year extended warranty certificate.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Case Thickness",
        "8.1mm Ultra-Thin Profile in Stainless Steel"
      ],
      [
        "Dial",
        "Petite Tapisserie in Original Bleu Nuit Nuage 50"
      ],
      [
        "Calibre",
        "7121 Self-Winding with 29.6mm Diameter"
      ],
      [
        "Finishing",
        "Hand-Polished Chamfers & Satin-Brushed Surfaces"
      ]
    ],
    "variants": [
      {
        "sku": "AP-16202ST",
        "name": "Steel / Bleu Nuit",
        "price": 325000000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "audemars-piguet-royal-oak-offshore-chronograph-43mm",
    "name": "Audemars Piguet Royal Oak Offshore Chronograph 43mm",
    "brand": "Audemars Piguet",
    "category": "watches-accessories",
    "titleLine1": "RO OFFSHORE",
    "titleLine2": "“CHRONOGRAPH”",
    "accent": "43MM TITANIUM",
    "tagline": "Muscular High-End Sport Architecture with Méga Tapisserie Dial",
    "badge": "TOP RATED",
    "description": "The unapologetic reinterpretation of luxury sport horology. Sculpted from lightweight grade 5 titanium with black ceramic bezel, pushers, and screw-down crown, Méga Tapisserie dial, flyback chronograph Calibre 4401, and interchangeable rubber strap.",
    "care": "Rinse thoroughly after contact with sea water.",
    "warranty": "Audemars Piguet 5-year extended warranty certificate.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Material",
        "Grade 5 Titanium with Black Ceramic Bezel & Pushers"
      ],
      [
        "Calibre",
        "Integrated Manufacture 4401 Flyback Chronograph"
      ],
      [
        "Dial",
        "Smoked Grey Méga Tapisserie with Black Counters"
      ],
      [
        "Strap System",
        "Proprietary Quick-Release Interchangeable System"
      ]
    ],
    "variants": [
      {
        "sku": "AP-26420TI",
        "name": "Titanium / Grey Dial",
        "price": 398000000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "audemars-piguet-royal-oak-chronograph-rose-gold-41mm",
    "name": "Audemars Piguet Royal Oak Chronograph 41mm Rose Gold",
    "brand": "Audemars Piguet",
    "category": "watches-accessories",
    "titleLine1": "ROYAL OAK",
    "titleLine2": "“ROSE GOLD CHRONO”",
    "accent": "41MM 18K 5N",
    "tagline": "Sublime 18K Pink Gold Craftsmanship with Grande Tapisserie Dial",
    "badge": "ICONIC GRAIL",
    "description": "Draped in warm, resplendent 18-carat pink gold. The 41mm case and integrated bracelet shimmer with alternating hand-satin brushing and mirror polished bevels, housing the blue Grande Tapisserie dial and manufacture Calibre 4401 column-wheel flyback chronograph.",
    "care": "Avoid wearing near hard gemstone bracelets. Annual water-resistance check.",
    "warranty": "Audemars Piguet 5-year extended warranty certificate.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Material",
        "Solid 18K Pink Gold Case, Bezel & Integrated Bracelet"
      ],
      [
        "Dial",
        "Bleu Nuit Grande Tapisserie with Pink Gold Hour Markers"
      ],
      [
        "Calibre",
        "4401 Flyback Chronograph with 22K Gold Rotor"
      ],
      [
        "Water Resistance",
        "50m Sapphire Exhibition Caseback"
      ]
    ],
    "variants": [
      {
        "sku": "AP-26240OR",
        "name": "18K Rose Gold / Blue",
        "price": 680000000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "audemars-piguet-code-1159-selfwinding-chronograph",
    "name": "Audemars Piguet Code 11.59 Chronograph Smoked Blue",
    "brand": "Audemars Piguet",
    "category": "watches-accessories",
    "titleLine1": "CODE 11.59",
    "titleLine2": "“CHRONOGRAPH”",
    "accent": "OCTAGONAL CASE",
    "tagline": "A Geometric Architectural Marvel with Double Curved Sapphire Crystal",
    "badge": "EDITORIAL CHOICE",
    "description": "A contemporary design triumph. Blending an octagonal middle case inside an ultra-thin round bezel with openworked hollow lugs, double-curved sapphire crystal with optic depth, and a hypnotizing smoked blue sunburst dial with gold hour markers.",
    "care": "Wipe sapphire crystal with lint-free optic cloth.",
    "warranty": "Audemars Piguet 5-year extended warranty certificate.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1622434641406-a158123450f9?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1622434641406-a158123450f9?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Case Architecture",
        "Round Bezel & Back Sandwiched Over Octagonal Mid-Case"
      ],
      [
        "Crystal",
        "Double Curved Anti-Reflective Glare-Proof Sapphire"
      ],
      [
        "Dial",
        "Smoked Blue Sunburst with Concentric Pattern Sub-Dials"
      ],
      [
        "Movement",
        "Calibre 4401 Selfwinding Flyback Chronograph"
      ]
    ],
    "variants": [
      {
        "sku": "AP-CODE-1159-BLU",
        "name": "White Gold / Smoked Blue",
        "price": 310000000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "audemars-piguet-royal-oak-double-balance-wheel-openworked",
    "name": "Audemars Piguet Royal Oak Double Balance Wheel Openworked",
    "brand": "Audemars Piguet",
    "category": "watches-accessories",
    "titleLine1": "ROYAL OAK",
    "titleLine2": "“SKELETON OPENWORKED”",
    "accent": "DOUBLE BALANCE",
    "tagline": "Dual Hairsprings on a Single Axis for Supreme Metrological Stability",
    "badge": "FLAGSHIP",
    "description": "A patented horological feat. By mounting two balance wheels and two hairsprings on the same axis, the system oscillates in perfect synchrony for unmatched precision, revealed through a meticulously skeletonized and hand-chamfered rhodium openworked dial.",
    "care": "Professional inspection recommended every 3 years.",
    "warranty": "Audemars Piguet Master Complications Warranty.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Innovation",
        "Patented Dual Balance Wheel & Hairspring System"
      ],
      [
        "Case",
        "41mm Stainless Steel (Thickness 9.9mm)"
      ],
      [
        "Dial",
        "Slate Grey Skeletonized Openwork with Pink Gold Hands"
      ],
      [
        "Calibre",
        "3132 Self-Winding with 245 Individually Finished Parts"
      ]
    ],
    "variants": [
      {
        "sku": "AP-15407ST",
        "name": "Steel / Openworked",
        "price": 820000000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "audemars-piguet-royal-oak-concept-flying-tourbillon",
    "name": "Audemars Piguet Royal Oak Concept Flying Tourbillon",
    "brand": "Audemars Piguet",
    "category": "watches-accessories",
    "titleLine1": "RO CONCEPT",
    "titleLine2": "“FLYING TOURBILLON”",
    "accent": "SANDBLASTED TITANIUM",
    "tagline": "Futuristic Avant-Garde Haute Horlogerie with Flying Tourbillon Cage",
    "badge": "LIMITED EDITION",
    "description": "The vanguard laboratory of Audemars Piguet haute horlogerie. Sandblasted titanium futuristic case housing the mesmerizing flying tourbillon at 9 o'clock, multi-tiered three-dimensional open architecture, and a 10-day power reserve indicator.",
    "care": "Store in custom climate-regulated presentation box.",
    "warranty": "Audemars Piguet Master Complications Warranty.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Complication",
        "Flying Tourbillon Revolving Once Per 60 Seconds"
      ],
      [
        "Case Size",
        "44mm Micro-Blasted Titanium with Ceramic Crown"
      ],
      [
        "Power Reserve",
        "Exceptional 237-Hour (10-Day) Twin Barrel Reserve"
      ],
      [
        "Strap",
        "Black Rubber with Sandblasted Titanium AP Folding Clasp"
      ]
    ],
    "variants": [
      {
        "sku": "AP-CONCEPT-TOURB",
        "name": "Sandblasted Titanium",
        "price": 1750000000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "omega-speedmaster-professional-moonwatch-master-chronometer",
    "name": "Omega Speedmaster Professional Moonwatch Co-Axial",
    "brand": "Omega",
    "category": "watches-accessories",
    "titleLine1": "SPEEDMASTER",
    "titleLine2": "“MOONWATCH”",
    "accent": "MASTER CHRONO",
    "tagline": "The Legendary Chronograph Flight-Qualified by NASA for All Manned Missions",
    "badge": "ICONIC GRAIL",
    "description": "The watch worn by Apollo 11 astronauts on the lunar surface. Features the classic 42mm asymmetrical steel case, black step dial, dot over ninety (DON) anodised aluminum bezel, sapphire exhibition caseback, and the Co-Axial Master Chronometer Calibre 3861.",
    "care": "Manual-wind smoothly until gentle resistance is felt.",
    "warranty": "Omega 5-year international warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Heritage",
        "Official NASA Flight-Qualified Moonwatch Specification"
      ],
      [
        "Calibre",
        "Omega 3861 Manual-Wind Co-Axial Master Chronometer"
      ],
      [
        "Magnetic Resistance",
        "Resistant to Magnetic Fields Reaching 15,000 Gauss"
      ],
      [
        "Bracelet",
        "Brushed-Polished Five-Arched-Links Steel Bracelet"
      ]
    ],
    "variants": [
      {
        "sku": "OMG-3103042",
        "name": "Steel / Sapphire Sandwich",
        "price": 83780000,
        "compareAt": null,
        "stock": 5,
        "max": 2
      }
    ]
  },
  {
    "slug": "omega-seamaster-diver-300m-co-axial-master-chronometer",
    "name": "Omega Seamaster Diver 300M Co-Axial Master Chronometer",
    "brand": "Omega",
    "category": "watches-accessories",
    "titleLine1": "SEAMASTER",
    "titleLine2": "“DIVER 300M”",
    "accent": "CERAMIC WAVE",
    "tagline": "Legendary Maritime Ocean Timepiece with Laser-Engraved Wave Dial",
    "badge": "TOP RATED",
    "description": "Since 1993, the Seamaster Diver 300M has enjoyed a legendary ocean following, made famous by James Bond. This 42mm model features black ceramic bezel with white enamel diving scale, polished black ceramic dial with laser-engraved waves, and helium escape valve.",
    "care": "Rinse with freshwater after diving. Helium valve should be closed.",
    "warranty": "Omega 5-year international warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Calibre",
        "Omega Co-Axial Master Chronometer 8800 Automatic"
      ],
      [
        "Dial",
        "Polished Black Zirconium Oxide Ceramic (ZrO2) with Waves"
      ],
      [
        "Water Resistance",
        "300 meters / 1,000 feet with Conical Helium Valve"
      ],
      [
        "Certification",
        "METAS Certified Master Chronometer Standard"
      ]
    ],
    "variants": [
      {
        "sku": "OMG-2103042",
        "name": "Steel / Black Wave",
        "price": 54000000,
        "compareAt": 59000000,
        "stock": 7,
        "max": 2
      }
    ]
  },
  {
    "slug": "omega-seamaster-aqua-terra-150m-shades-terracotta",
    "name": "Omega Seamaster Aqua Terra 150M Shades Terracotta",
    "brand": "Omega",
    "category": "watches-accessories",
    "titleLine1": "AQUA TERRA",
    "titleLine2": "“TERRACOTTA”",
    "accent": "150M SHADES",
    "tagline": "Vibrant Earthy Sun-Brushed Terracotta Dial with Symmetrical Steel Case",
    "badge": "NEW ARRIVAL",
    "description": "An ocean-to-earth aesthetic triumph. The 38mm symmetrical polished stainless steel case surrounds an unforgettable sun-brushed terracotta dial crafted from brass and lacquered from the center out, powered by the antimagnetic Calibre 8800.",
    "care": "Clean with soft cloth. Water resistant up to 150m for swimming.",
    "warranty": "Omega 5-year international warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Dial Tone",
        "Vibrant Sun-Brushed Terracotta Lacquered Finish"
      ],
      [
        "Case Size",
        "38mm Polished Symmetrical Stainless Steel"
      ],
      [
        "Movement",
        "Omega Co-Axial Master Chronometer Calibre 8800"
      ],
      [
        "Bracelet",
        "Redesigned Rounded Links with Butterfly Folding Clasp"
      ]
    ],
    "variants": [
      {
        "sku": "OMG-2201038",
        "name": "Steel / Terracotta 38mm",
        "price": 61000000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      }
    ]
  },
  {
    "slug": "omega-constellation-co-axial-master-chronometer-sedna-gold",
    "name": "Omega Constellation Co-Axial 41mm Sedna Gold & Steel",
    "brand": "Omega",
    "category": "watches-accessories",
    "titleLine1": "CONSTELLATION",
    "titleLine2": "“SEDNA GOLD”",
    "accent": "41MM TWO-TONE",
    "tagline": "The Famous Claws and Half-Moon Facets in Exclusive 18K Sedna Gold",
    "badge": "HERITAGE",
    "description": "Dramatic and enduring design defined by the famous claws on the case flanks. Cased in stainless steel and 18K Sedna Gold with a polished black ceramic bezel ring with Roman numerals in Ceragold, sun-brushed black dial, and rubber-lined alligator strap.",
    "care": "Avoid exposure to harsh household abrasives.",
    "warranty": "Omega 5-year international warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1619134778706-7015533a6150?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1619134778706-7015533a6150?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Gold Alloy",
        "Proprietary 18K Sedna Gold (Resistant to Fading)"
      ],
      [
        "Bezel",
        "Black Polished Ceramic with Roman Numerals in OMEGA Ceragold"
      ],
      [
        "Dial",
        "Sun-Brushed Silk-Embossed Black Dial with Star Emblem"
      ],
      [
        "Calibre",
        "Omega Co-Axial Master Chronometer 8900"
      ]
    ],
    "variants": [
      {
        "sku": "OMG-1312341",
        "name": "Steel & Sedna Gold / Black",
        "price": 92000000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      }
    ]
  },
  {
    "slug": "omega-seamaster-planet-ocean-6000m-ultra-deep-titanium",
    "name": "Omega Seamaster Planet Ocean 6000M Ultra Deep Titanium",
    "brand": "Omega",
    "category": "watches-accessories",
    "titleLine1": "PLANET OCEAN",
    "titleLine2": "“ULTRA DEEP”",
    "accent": "6000M TITANIUM",
    "tagline": "Forged for Mariana Trench Depths with Grade 5 Titanium Manta Lugs",
    "badge": "FLAGSHIP",
    "description": "Born from the record-breaking dive to the Mariana Trench (10,928m). Built from sandblasted grade 5 titanium with brushed ceramic bezel and Liquidmetal scale, distinctive 'Manta' open lugs, black ceramised titanium dial, and striped polyamide NATO strap.",
    "care": "Rinse with freshwater after extreme deep dives.",
    "warranty": "Omega 5-year international warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1518131672697-613becd4fab5?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1518131672697-613becd4fab5?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Depth Rating",
        "Certified to 6,000m / 20,000ft (Tested to 7,500m)"
      ],
      [
        "Material",
        "Sandblasted Grade 5 Titanium with Open Manta Lugs"
      ],
      [
        "Dial",
        "Black Ceramised Grade 5 Titanium with Cyan Numerals"
      ],
      [
        "Crystal",
        "Protruding Domed EFG Sapphire with Extreme Thickness"
      ]
    ],
    "variants": [
      {
        "sku": "OMG-2159246",
        "name": "Grade 5 Titanium / NATO",
        "price": 125000000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "omega-speedmaster-dark-side-of-the-moon-black-ceramic",
    "name": "Omega Speedmaster Dark Side of the Moon Black Ceramic",
    "brand": "Omega",
    "category": "watches-accessories",
    "titleLine1": "SPEEDMASTER",
    "titleLine2": "“DARK SIDE”",
    "accent": "BLACK CERAMIC",
    "tagline": "Machined from a Single Solid Block of Pure Black Zirconium Oxide Ceramic",
    "badge": "LIMITED EDITION",
    "description": "Saluting the Apollo 8 astronauts who were the first humans to see the dark side of the moon with their own eyes. Machined from a single block of black ceramic with matching black zirconium oxide ceramic dial, 18K white gold hands, and Calibre 9300.",
    "care": "Ceramic is exceptionally scratch-proof; protect from heavy impacts on stone.",
    "warranty": "Omega 5-year international warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Construction",
        "Monobloc Black Ceramic (ZrO2) Case, Bezel & Pushers"
      ],
      [
        "Calibre",
        "Omega Co-Axial Chronograph 9300 with Si14 Silicon Balance"
      ],
      [
        "Dial",
        "Polished Black Ceramic with Dual Sub-Dial Architecture"
      ],
      [
        "Strap",
        "Coated Black Cordura Fabric with Ceramic Folding Clasp"
      ]
    ],
    "variants": [
      {
        "sku": "OMG-3119244",
        "name": "Black Ceramic / Cordura",
        "price": 118000000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "cartier-santos-de-cartier-large-model-steel",
    "name": "Cartier Santos de Cartier Large Model Steel",
    "brand": "Cartier",
    "category": "watches-accessories",
    "titleLine1": "SANTOS DE CARTIER",
    "titleLine2": "“LARGE STEEL”",
    "accent": "AUTOMATIC 1847 MC",
    "tagline": "The World's Very First Modern Pilot's Wristwatch Created in 1904",
    "badge": "ICONIC GRAIL",
    "description": "Designed by Louis Cartier in 1904 for aviation pioneer Alberto Santos-Dumont. The large model in steel features visible bezel screws, silvered opaline dial, blued-steel sword hands, sapphire cabochon crown, and QuickSwitch bracelet interchangeability.",
    "care": "Rinse with freshwater after swimming. Includes second calfskin strap.",
    "warranty": "Cartier 8-year international Care Program guarantee.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Movement",
        "Cartier Manufacture 1847 MC Mechanical Automatic"
      ],
      [
        "Case Dimensions",
        "39.8mm Width, 47.5mm Height, 9.38mm Thickness"
      ],
      [
        "Crown",
        "Heptagonal Steel Crown Set with a Faceted Synthetic Blue Spinel"
      ],
      [
        "SmartLink System",
        "Tool-Free Bracelet Link Adjustment & QuickSwitch"
      ]
    ],
    "variants": [
      {
        "sku": "CRT-WSSA0018",
        "name": "Large Model / Steel",
        "price": 71500000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      }
    ]
  },
  {
    "slug": "cartier-tank-must-extra-large-model-automatic",
    "name": "Cartier Tank Must Extra-Large Model Automatic",
    "brand": "Cartier",
    "category": "watches-accessories",
    "titleLine1": "TANK MUST",
    "titleLine2": "“EXTRA-LARGE”",
    "accent": "GUILLOCHÉ DIAL",
    "tagline": "Geometric Harmony and Art Deco Purity Inspired by WWI Military Tanks",
    "badge": "TOP RATED",
    "description": "The timeless rectangular elegance worn by Andy Warhol and Jacqueline Kennedy. The extra-large Tank Must features fluted crown set with a synthetic cabochon spinel, silvered flinqué dial, blued sword-shaped steel hands, calendar aperture at 6, and manufacture Calibre 1847 MC.",
    "care": "Keep away from high magnetic induction cookers.",
    "warranty": "Cartier 8-year international Care Program guarantee.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Case Geometry",
        "41mm x 31mm Rectangular Art Deco Profile"
      ],
      [
        "Dial",
        "Silvered Flinqué Guilloché with Roman Numerals"
      ],
      [
        "Calibre",
        "Mechanical Automatic 1847 MC with Date Function"
      ],
      [
        "Strap",
        "Grained Black Calfskin with Interchangeable Steel Deployant"
      ]
    ],
    "variants": [
      {
        "sku": "CRT-WSTA0040",
        "name": "Extra-Large / Black Leather",
        "price": 46500000,
        "compareAt": null,
        "stock": 6,
        "max": 2
      }
    ]
  },
  {
    "slug": "cartier-ballon-bleu-de-cartier-40mm-steel",
    "name": "Cartier Ballon Bleu de Cartier 40mm Steel",
    "brand": "Cartier",
    "category": "watches-accessories",
    "titleLine1": "BALLON BLEU",
    "titleLine2": "“40MM STEEL”",
    "accent": "BLUE CABOCHON",
    "tagline": "Pebble-Like Convex Curves with Enclosed Floating Sapphire Crown",
    "badge": "EDITORIAL CHOICE",
    "description": "Floating like a balloon, as blue as the cabochon safely nestled within its side. The convex curves of the polished steel case create an exquisite tactile pebble feel, highlighting the guilloché silver dial, Roman numerals, and manufacture automatic movement.",
    "care": "Wipe polished curves with micro-suede cloth.",
    "warranty": "Cartier 8-year international Care Program guarantee.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Crown Architecture",
        "Integrated Protective Crown Guard with Blue Synthetic Spinel"
      ],
      [
        "Case",
        "40mm High-Polish Pebble Curved Stainless Steel"
      ],
      [
        "Dial",
        "Silvered Guilloché Sunray with Date Aperture at 3 o'clock"
      ],
      [
        "Movement",
        "Cartier Calibre 1847 MC Self-Winding"
      ]
    ],
    "variants": [
      {
        "sku": "CRT-WSBB0040",
        "name": "40mm Steel Bracelet",
        "price": 63000000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      }
    ]
  },
  {
    "slug": "cartier-love-bracelet-18k-yellow-gold-screw-motif",
    "name": "Cartier LOVE Bracelet 18K Yellow Gold",
    "brand": "Cartier",
    "category": "watches-accessories",
    "titleLine1": "CARTIER",
    "titleLine2": "“LOVE BRACELET”",
    "accent": "18K YELLOW GOLD",
    "tagline": "The Unmistakable Emblem of Eternal Devotion with Functional Screws",
    "badge": "ICONIC GRAIL",
    "description": "Created in New York in 1969 by Aldo Cipullo. An oval bracelet composed of two rigid arcs fitted tightly to the wrist that can only be locked or unlocked using a dedicated matching Cartier gold screwdriver, embodying timeless, unbreakable passion.",
    "care": "Clean with lukewarm soapy water and soft brush. Polish with gold cloth.",
    "warranty": "Cartier Certificate of Authenticity with Unique Serial Number.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Material",
        "Solid 18K Yellow Gold (750/1000) High-Polish"
      ],
      [
        "Motif",
        "Precision-Engineered Recessed Screwhead Perimeter"
      ],
      [
        "Mechanism",
        "Dual Removable Screws with Ergonomic Gold Screwdriver"
      ],
      [
        "Origin",
        "Hallmarked by Maison Cartier, France"
      ]
    ],
    "variants": [
      {
        "sku": "CRT-LOVE-YG-Size17",
        "name": "Size 17",
        "size": "Size 17",
        "price": 69000000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "CRT-LOVE-YG-Size18",
        "name": "Size 18",
        "size": "Size 18",
        "price": 69000000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      },
      {
        "sku": "CRT-LOVE-YG-Size19",
        "name": "Size 19",
        "size": "Size 19",
        "price": 69000000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "cartier-juste-un-clou-bracelet-18k-yellow-gold",
    "name": "Cartier Juste un Clou Bracelet 18K Yellow Gold",
    "brand": "Cartier",
    "category": "watches-accessories",
    "titleLine1": "JUSTE UN CLOU",
    "titleLine2": "“GOLD BRACELET”",
    "accent": "18K YELLOW GOLD",
    "tagline": "Elevating the Ordinary Nail into an Avant-Garde Fine Jewelry Icon",
    "badge": "FLAGSHIP",
    "description": "Conceived in 1970s New York during the Studio 54 era. Juste un Clou transforms a simple nail into a magnificent, bold fine jewelry piece. Forged in solid 18K yellow gold with ribbed nail-head detailing and seamless spring-hinge clasp.",
    "care": "Keep in velvet Cartier pouch when not in use.",
    "warranty": "Cartier Certificate of Authenticity with Unique Serial Number.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Design",
        "Sculpted Solid Gold Nail Silhouette with Grooved Head"
      ],
      [
        "Material",
        "Solid 18K Yellow Gold (750/1000)"
      ],
      [
        "Closure",
        "Concealed Push-Button Clasp Built into the Tapered Point"
      ],
      [
        "Hallmark",
        "Individually Numbered & Stamped Cartier Assay Mark"
      ]
    ],
    "variants": [
      {
        "sku": "CRT-JUC-YG-Size16",
        "name": "Size 16",
        "size": "Size 16",
        "price": 74500000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "CRT-JUC-YG-Size17",
        "name": "Size 17",
        "size": "Size 17",
        "price": 74500000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "CRT-JUC-YG-Size18",
        "name": "Size 18",
        "size": "Size 18",
        "price": 74500000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "cartier-panthere-de-cartier-medium-model-18k-yellow-gold",
    "name": "Cartier Panthère de Cartier Medium Model 18K Yellow Gold",
    "brand": "Cartier",
    "category": "watches-accessories",
    "titleLine1": "PANTHÈRE",
    "titleLine2": "“MEDIUM GOLD”",
    "accent": "SOLID 18K GOLD",
    "tagline": "The Quintessential Jewelry Watch with Ultra-Supple Gold Fluid Bracelet",
    "badge": "HAUTE HORLOGERIE",
    "description": "Both a magnificent timepiece and an alluring piece of high jewelry. Born in the 1980s, the Panthère de Cartier flows around the wrist with a sensual, ultra-flexible linked bracelet resembling the feline predator's magnetic glide, cast in solid 18K yellow gold.",
    "care": "Wipe gold links gently with soft jewelers cloth.",
    "warranty": "Cartier 8-year international Care Program guarantee.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Material",
        "Solid 18K Yellow Gold Case, Bezel & Multi-Link Bracelet"
      ],
      [
        "Dimensions",
        "27mm x 37mm Medium Rectangular Profile"
      ],
      [
        "Movement",
        "High-Autonomy Long-Life Cartier Quartz Calibre"
      ],
      [
        "Gemstone Crown",
        "Set with a Blue Sapphire Cabochon"
      ]
    ],
    "variants": [
      {
        "sku": "CRT-WGPN0009",
        "name": "Medium / 18K Yellow Gold",
        "price": 241000000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "nike-kobe-6-protro-reverse-grinch",
    "name": "Nike Kobe 6 Protro “Reverse Grinch”",
    "brand": "Nike",
    "category": "sneakers-footwear",
    "titleLine1": "KOBE 6",
    "titleLine2": "“REVERSE GRINCH”",
    "accent": "PROTRO PERFORMANCE",
    "tagline": "The Mamba's Sculpted Snake-Scale Silhouette in Fiery Bright Crimson",
    "badge": "ICONIC GRAIL",
    "description": "Reversing the iconic 2010 Christmas colorway. The Kobe 6 Protro pairs a ferocious Bright Crimson snakeskin-textured polyurethane micro-scale upper with Electric Green laces and Swoosh, Turbo Zoom Air cushioning, and responsive Cushlon foam.",
    "care": "Spot clean scales with soft brush. Keep out of extreme heat.",
    "warranty": "Nike standard footwear warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Texture",
        "Molded Polyurethane Islands Replicating Snakeskin"
      ],
      [
        "Forefoot Cushioning",
        "Nike Air Zoom Turbo Articulated Unit"
      ],
      [
        "Midsole",
        "High-Response Injected Cushlon Foam Core"
      ],
      [
        "Outsole",
        "Multi-Directional Mamba Scale Traction Pattern"
      ]
    ],
    "variants": [
      {
        "sku": "KOBE6-REV-UK7.5",
        "name": "UK 7.5",
        "size": "UK 7.5",
        "price": 1699500,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "KOBE6-REV-UK8.5",
        "name": "UK 8.5",
        "size": "UK 8.5",
        "price": 1699500,
        "compareAt": null,
        "stock": 4,
        "max": 1
      },
      {
        "sku": "KOBE6-REV-UK9.5",
        "name": "UK 9.5",
        "size": "UK 9.5",
        "price": 1699500,
        "compareAt": null,
        "stock": 6,
        "max": 1
      },
      {
        "sku": "KOBE6-REV-UK10.5",
        "name": "UK 10.5",
        "size": "UK 10.5",
        "price": 1699500,
        "compareAt": null,
        "stock": 3,
        "max": 1
      },
      {
        "sku": "KOBE6-REV-UK11.5",
        "name": "UK 11.5",
        "size": "UK 11.5",
        "price": 1699500,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "nike-dunk-low-retro-panda-black-white",
    "name": "Nike Dunk Low Retro “Panda” Black & White",
    "brand": "Nike",
    "category": "sneakers-footwear",
    "titleLine1": "DUNK LOW",
    "titleLine2": "“PANDA”",
    "accent": "RETRO WHITE/BLACK",
    "tagline": "The Most Versatile Hardwood Heritage Staple in Contemporary Streetwear",
    "badge": "TOP RATED",
    "description": "Created for the hardwood and embraced by global skate culture. The Dunk Low Panda channels retro 1985 aesthetics with clean two-tone black and white leather color blocking, padded low-cut collar, and a durable rubber cupsole with pivot circle traction.",
    "care": "Wipe with damp cloth and sneaker wipe. Use shoe trees to maintain toe-box.",
    "warranty": "Nike standard footwear warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Leather",
        "Full Smooth Leather Construction with Perforated Toe"
      ],
      [
        "Collar",
        "Padded Low-Cut Collar with Breathable Mesh Lining"
      ],
      [
        "Midsole",
        "Lightweight Foam Midsole for Soft Cushioning"
      ],
      [
        "Traction",
        "Heritage Circular Pivot Traction Outsole"
      ]
    ],
    "variants": [
      {
        "sku": "DUNK-PANDA-UK6",
        "name": "UK 6",
        "size": "UK 6",
        "price": 869500,
        "compareAt": 1099500,
        "stock": 8,
        "max": 3
      },
      {
        "sku": "DUNK-PANDA-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 869500,
        "compareAt": 1099500,
        "stock": 14,
        "max": 3
      },
      {
        "sku": "DUNK-PANDA-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 869500,
        "compareAt": 1099500,
        "stock": 20,
        "max": 3
      },
      {
        "sku": "DUNK-PANDA-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 869500,
        "compareAt": 1099500,
        "stock": 18,
        "max": 3
      },
      {
        "sku": "DUNK-PANDA-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 869500,
        "compareAt": 1099500,
        "stock": 12,
        "max": 3
      },
      {
        "sku": "DUNK-PANDA-UK11",
        "name": "UK 11",
        "size": "UK 11",
        "price": 869500,
        "compareAt": 1099500,
        "stock": 6,
        "max": 3
      }
    ]
  },
  {
    "slug": "nike-air-max-95-og-neon-yellow",
    "name": "Nike Air Max 95 OG “Neon Yellow”",
    "brand": "Nike",
    "category": "sneakers-footwear",
    "titleLine1": "AIR MAX 95",
    "titleLine2": "“NEON OG”",
    "accent": "SERGIO LOZANO",
    "tagline": "Human Anatomy-Inspired Gradient Running Icon with Forefoot Visible Air",
    "badge": "HERITAGE",
    "description": "Sergio Lozano's 1995 masterpiece modeled after the human body—ribs, vertebrae, muscle fibers, and skin. Gradient grey suede panels descend to a solid black midsole, electrified by vibrant Neon Yellow lace loops and dual visible Air-Sole chambers.",
    "care": "Clean suede panels with dedicated suede dry brush and eraser.",
    "warranty": "Nike standard footwear warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Design Metaphor",
        "Human Anatomy Ribs, Spine & Muscle Layers"
      ],
      [
        "Panels",
        "Quad-Layered Gradient Suede & Technical Mesh"
      ],
      [
        "Cushioning",
        "Dual-Chamber Forefoot & Heel Visible Max Air"
      ],
      [
        "Eyelets",
        "High-Tensile Neon Yellow Quick-Pull Lace Loops"
      ]
    ],
    "variants": [
      {
        "sku": "AM95-NEON-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 1599500,
        "compareAt": null,
        "stock": 3,
        "max": 2
      },
      {
        "sku": "AM95-NEON-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 1599500,
        "compareAt": null,
        "stock": 6,
        "max": 2
      },
      {
        "sku": "AM95-NEON-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 1599500,
        "compareAt": null,
        "stock": 8,
        "max": 2
      },
      {
        "sku": "AM95-NEON-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 1599500,
        "compareAt": null,
        "stock": 4,
        "max": 2
      }
    ]
  },
  {
    "slug": "nike-air-force-1-07-craft-pristine-white",
    "name": "Nike Air Force 1 '07 Craft Pristine White",
    "brand": "Nike",
    "category": "sneakers-footwear",
    "titleLine1": "AIR FORCE 1",
    "titleLine2": "“'07 CRAFT”",
    "accent": "PRISTINE WHITE",
    "tagline": "Bruce Kilgore's Legendary 1982 Silhouette Rebuilt in Buttery Tumbled Leather",
    "badge": "EDITORIAL CHOICE",
    "description": "A luxurious elevation of the greatest shoe of all time. The AF1 '07 Craft swaps standard leather for exceptionally supple, ultra-soft tumbled full-grain leather with brushed suede heel tabs, raw stitching details, and plush padded ankle collars.",
    "care": "Clean regularly with foam sneaker cleaner and soft bristle brush.",
    "warranty": "Nike standard footwear warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Leather Grade",
        "Premium Ultra-Supple Tumbled Leather"
      ],
      [
        "Heel Counter",
        "Brushed Suede Tab with Minimalist Debossed Branding"
      ],
      [
        "Cushioning",
        "Full-Length Encapsulated Nike Air Sole Unit"
      ],
      [
        "Stitching",
        "Re-engineered Artisan Exposed Seams"
      ]
    ],
    "variants": [
      {
        "sku": "AF1-CRF-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 999500,
        "compareAt": null,
        "stock": 6,
        "max": 3
      },
      {
        "sku": "AF1-CRF-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 999500,
        "compareAt": null,
        "stock": 12,
        "max": 3
      },
      {
        "sku": "AF1-CRF-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 999500,
        "compareAt": null,
        "stock": 14,
        "max": 3
      },
      {
        "sku": "AF1-CRF-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 999500,
        "compareAt": null,
        "stock": 10,
        "max": 3
      },
      {
        "sku": "AF1-CRF-UK11",
        "name": "UK 11",
        "size": "UK 11",
        "price": 999500,
        "compareAt": null,
        "stock": 5,
        "max": 3
      }
    ]
  },
  {
    "slug": "nike-vaporfly-3-next-percent-marathon-racer",
    "name": "Nike Vaporfly 3 Next% Elite Marathon Racer",
    "brand": "Nike",
    "category": "sneakers-footwear",
    "titleLine1": "VAPORFLY 3",
    "titleLine2": "“NEXT%”",
    "accent": "FLYPLATE CARBON",
    "tagline": "The World-Record Breaking Super-Shoe Delivering Unrivaled Energy Return",
    "badge": "FLAGSHIP",
    "description": "The race-day weapon that reshaped marathon running. Engineered with a full-length carbon fiber Flyplate, ultra-responsive Nike ZoomX foam midsole with modified rocker geometry, and featherlight Flyknit upper for locked-in race-day breathability.",
    "care": "Use exclusively on road race courses for peak longevity.",
    "warranty": "Nike standard footwear warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Carbon Technology",
        "Full-Length Curved Carbon Fiber Flyplate"
      ],
      [
        "Foam",
        "Resilient High-Energy Return Nike ZoomX Compound"
      ],
      [
        "Upper",
        "Zonal Engineered Flyknit with Aerodynamic Weave"
      ],
      [
        "Weight",
        "Sub-198g Featherlight Race Engineering"
      ]
    ],
    "variants": [
      {
        "sku": "VF3-RACE-UK7.5",
        "name": "UK 7.5",
        "size": "UK 7.5",
        "price": 2069500,
        "compareAt": 2399500,
        "stock": 3,
        "max": 2
      },
      {
        "sku": "VF3-RACE-UK8.5",
        "name": "UK 8.5",
        "size": "UK 8.5",
        "price": 2069500,
        "compareAt": 2399500,
        "stock": 5,
        "max": 2
      },
      {
        "sku": "VF3-RACE-UK9.5",
        "name": "UK 9.5",
        "size": "UK 9.5",
        "price": 2069500,
        "compareAt": 2399500,
        "stock": 7,
        "max": 2
      },
      {
        "sku": "VF3-RACE-UK10.5",
        "name": "UK 10.5",
        "size": "UK 10.5",
        "price": 2069500,
        "compareAt": 2399500,
        "stock": 2,
        "max": 2
      }
    ]
  },
  {
    "slug": "nike-sb-dunk-low-pro-chicago-j-pack",
    "name": "Nike SB Dunk Low Pro “Chicago J-Pack”",
    "brand": "Nike",
    "category": "sneakers-footwear",
    "titleLine1": "NIKE SB",
    "titleLine2": "“CHICAGO DUNK”",
    "accent": "PRO SKATE",
    "tagline": "The Iconic Chicago 1985 Hardwood Palette Transformed for Skateboarding",
    "badge": "LIMITED EDITION",
    "description": "Where skateboarding culture meets hardwood royalty. Adorned in the indelible Chicago red, white, and black leather color blocking, accompanied by a fat padded SB tongue, Zoom Air insole heel cushioning, and reinforced cupsole for heavy street skating.",
    "care": "Wipe clean with soft microfiber towel. Keep dry.",
    "warranty": "Nike SB standard warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Skate Spec",
        "Fat Padded Mesh Tongue with Stuffed Foam Collar"
      ],
      [
        "Insole",
        "Removable Nike Zoom Air Cushioning Unit in Heel"
      ],
      [
        "Leather",
        "Hard-Wearing Smooth Leather Toe & Overlays"
      ],
      [
        "Grip",
        "Skate-Specific Rubber Tread with Forefoot Flex Grooves"
      ]
    ],
    "variants": [
      {
        "sku": "SB-CHI-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 2699500,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "SB-CHI-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 2699500,
        "compareAt": null,
        "stock": 3,
        "max": 1
      },
      {
        "sku": "SB-CHI-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 2699500,
        "compareAt": null,
        "stock": 3,
        "max": 1
      },
      {
        "sku": "SB-CHI-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 2699500,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "adidas-yeezy-boost-350-v2-bone-primeknit",
    "name": "adidas Yeezy Boost 350 V2 “Bone”",
    "brand": "Adidas",
    "category": "sneakers-footwear",
    "titleLine1": "YEEZY BOOST",
    "titleLine2": "“350 V2 BONE”",
    "accent": "PRIMEKNIT BOOST",
    "tagline": "Monochromatic Cloud-White Primeknit with Full-Length Boost Core",
    "badge": "ICONIC GRAIL",
    "description": "The silhouette that revolutionized 2010s sneaker design. Features an ivory re-engineered Primeknit upper with a monofilament side stripe woven directly into the side panel, resting on a ribbed translucent TPU midsole encapsulating full-length Boost cushioning.",
    "care": "Clean with mild detergent and cold water. Air dry away from direct heat.",
    "warranty": "adidas standard footwear warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Upper",
        "Engineered Multi-Tonal Bone White Primeknit Weave"
      ],
      [
        "Cushioning",
        "Full-Length Encapsulated adidas Boost Pellets"
      ],
      [
        "Stripe",
        "Post-Dyed Monofilament Translucent Lateral Stripe"
      ],
      [
        "Cage",
        "Ribbed Semi-Translucent Rubber Midsole Shell"
      ]
    ],
    "variants": [
      {
        "sku": "YZY-350-BONE-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 2299900,
        "compareAt": null,
        "stock": 3,
        "max": 1
      },
      {
        "sku": "YZY-350-BONE-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 2299900,
        "compareAt": null,
        "stock": 6,
        "max": 1
      },
      {
        "sku": "YZY-350-BONE-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 2299900,
        "compareAt": null,
        "stock": 8,
        "max": 1
      },
      {
        "sku": "YZY-350-BONE-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 2299900,
        "compareAt": null,
        "stock": 5,
        "max": 1
      },
      {
        "sku": "YZY-350-BONE-UK11",
        "name": "UK 11",
        "size": "UK 11",
        "price": 2299900,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "adidas-originals-samba-og-cloud-white-core-black",
    "name": "adidas Originals Samba OG Cloud White",
    "brand": "Adidas",
    "category": "sneakers-footwear",
    "titleLine1": "ORIGINALS",
    "titleLine2": "“SAMBA OG”",
    "accent": "GUM SOLE CLASSIC",
    "tagline": "Born for Frozen Football Pitches, Reclaimed by Global Runway Style",
    "badge": "TOP RATED",
    "description": "First developed in 1950 to train footballers on icy turf. The Samba OG remains an irreplaceable global lifestyle titan, crafted from smooth full-grain white leather with an iconic suede T-toe overlay, serrated black 3-Stripes, and low-profile gum rubber outsole.",
    "care": "Brush suede T-toe with suede eraser. Wipe leather smooth with damp cloth.",
    "warranty": "adidas standard footwear warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "T-Toe Guard",
        "Reinforced Grey Suede Protective Toe Overlay"
      ],
      [
        "Leather",
        "Full-Grain Supple White Leather with Serrated 3-Stripes"
      ],
      [
        "Outsole",
        "Vintage Dark Caramel Gum Rubber Pivot Tread"
      ],
      [
        "Branding",
        "Gold Foil 'SAMBA' Debossed Lateral Quarter Script"
      ]
    ],
    "variants": [
      {
        "sku": "SAMBA-OG-UK6",
        "name": "UK 6",
        "size": "UK 6",
        "price": 1099900,
        "compareAt": null,
        "stock": 10,
        "max": 3
      },
      {
        "sku": "SAMBA-OG-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 1099900,
        "compareAt": null,
        "stock": 15,
        "max": 3
      },
      {
        "sku": "SAMBA-OG-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 1099900,
        "compareAt": null,
        "stock": 22,
        "max": 3
      },
      {
        "sku": "SAMBA-OG-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 1099900,
        "compareAt": null,
        "stock": 18,
        "max": 3
      },
      {
        "sku": "SAMBA-OG-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 1099900,
        "compareAt": null,
        "stock": 9,
        "max": 3
      }
    ]
  },
  {
    "slug": "adidas-gazelle-indoor-blue-fusion-gum-sole",
    "name": "adidas Gazelle Indoor “Blue Fusion Gum”",
    "brand": "Adidas",
    "category": "sneakers-footwear",
    "titleLine1": "GAZELLE",
    "titleLine2": "“INDOOR”",
    "accent": "BLUE FUSION",
    "tagline": "Translucent Wrapped Gum Cupsole with Plush Saturated Blue Suede",
    "badge": "NEW ARRIVAL",
    "description": "The 1979 indoor sports legend revived. Featuring ultra-rich Blue Fusion suede that drapes the upper, contrasted by crisp white leather three-stripes and a signature translucent gum rubber cupsole that wraps up around the midsole perimeter.",
    "care": "Protect with waterproof suede protector spray before first wear.",
    "warranty": "adidas standard footwear warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Suede",
        "Premium Velvet Heavy-Nap Suede Upper"
      ],
      [
        "Cupsole",
        "Semi-Translucent Gum Rubber Wrap Construction"
      ],
      [
        "Tongue",
        "Textured Trefoil Molded Dimpled Tongue"
      ],
      [
        "Lining",
        "Supple Synthetic Leather Quarter & Heel Lining"
      ]
    ],
    "variants": [
      {
        "sku": "GAZ-IND-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 1199900,
        "compareAt": 1399900,
        "stock": 5,
        "max": 2
      },
      {
        "sku": "GAZ-IND-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 1199900,
        "compareAt": 1399900,
        "stock": 8,
        "max": 2
      },
      {
        "sku": "GAZ-IND-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 1199900,
        "compareAt": 1399900,
        "stock": 9,
        "max": 2
      },
      {
        "sku": "GAZ-IND-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 1199900,
        "compareAt": 1399900,
        "stock": 4,
        "max": 2
      }
    ]
  },
  {
    "slug": "adidas-x-wales-bonner-samba-silver-metallic",
    "name": "adidas x Wales Bonner Samba Silver Metallic",
    "brand": "Adidas",
    "category": "sneakers-footwear",
    "titleLine1": "WALES BONNER",
    "titleLine2": "“METALLIC SAMBA”",
    "accent": "FOLD-OVER TONGUE",
    "tagline": "Poetic British-Jamaican Luxury Fashion Collaboration with Mirror Chrome Sheen",
    "badge": "LIMITED EDITION",
    "description": "Grace Wales Bonner's critically acclaimed high-fashion collaboration. Cloaked in a head-turning liquid silver chrome mirror finish, featuring oversized fold-over football tongue, crochet whipstitch details along the heel and 3-stripes, and chocolate brown lining.",
    "care": "Wipe with delicate jewelry polishing cloth. Store in bespoke dust bags.",
    "warranty": "adidas x Wales Bonner collaborative warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Finish",
        "High-Gloss Mirror Silver Metallic Coated Leather"
      ],
      [
        "Tongue",
        "Elongated Football Fold-Over Flap Tongue"
      ],
      [
        "Stitching",
        "Handmade Contrast Crochet Whipstitch Accents"
      ],
      [
        "Interior",
        "Rich Silk-Satin Chocolate Brown Ankle Lining"
      ]
    ],
    "variants": [
      {
        "sku": "WB-SAMBA-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 3499900,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "WB-SAMBA-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 3499900,
        "compareAt": null,
        "stock": 3,
        "max": 1
      },
      {
        "sku": "WB-SAMBA-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 3499900,
        "compareAt": null,
        "stock": 3,
        "max": 1
      },
      {
        "sku": "WB-SAMBA-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 3499900,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "adidas-ultraboost-light-running-shoes",
    "name": "adidas Ultraboost Light Performance Runner",
    "brand": "Adidas",
    "category": "sneakers-footwear",
    "titleLine1": "ULTRABOOST",
    "titleLine2": "“LIGHT”",
    "accent": "LIGHT BOOST 30%",
    "tagline": "Our Lightest Boost Ever Engineered with 30% Lighter Molecular Foam",
    "badge": "EDITORIAL CHOICE",
    "description": "Experience epic energy in every stride. Powered by new generation Light BOOST, our lightest foam material ever, providing 4% more energy return. Paired with a sock-like Primeknit+ textile upper and Continental™ Better Rubber outsole.",
    "care": "Machine wash cold inside laundry bag. Air dry only.",
    "warranty": "adidas standard footwear warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Light BOOST",
        "30% Lighter Molecular Weight BOOST Pellets"
      ],
      [
        "Torsion System",
        "Linear Energy Push (LEP) Torsional Stability Bar"
      ],
      [
        "Outsole",
        "Continental™ Natural Rubber Grippy Compound"
      ],
      [
        "Sustainability",
        "Primeknit+ Forged with 50% Parley Ocean Plastic"
      ]
    ],
    "variants": [
      {
        "sku": "UB-LIGHT-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 1899900,
        "compareAt": 2199900,
        "stock": 4,
        "max": 2
      },
      {
        "sku": "UB-LIGHT-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 1899900,
        "compareAt": 2199900,
        "stock": 9,
        "max": 2
      },
      {
        "sku": "UB-LIGHT-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 1899900,
        "compareAt": 2199900,
        "stock": 12,
        "max": 2
      },
      {
        "sku": "UB-LIGHT-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 1899900,
        "compareAt": 2199900,
        "stock": 8,
        "max": 2
      },
      {
        "sku": "UB-LIGHT-UK11",
        "name": "UK 11",
        "size": "UK 11",
        "price": 1899900,
        "compareAt": 2199900,
        "stock": 3,
        "max": 2
      }
    ]
  },
  {
    "slug": "adidas-stan-smith-lux-off-white-cream-leather",
    "name": "adidas Stan Smith Lux Off-White / Cream",
    "brand": "Adidas",
    "category": "sneakers-footwear",
    "titleLine1": "STAN SMITH",
    "titleLine2": "“LUX EDITION”",
    "accent": "ULTRA-LUXE LEATHER",
    "tagline": "Elevated Court Masterpiece Fully Lined with Buttery Calf Leather",
    "badge": "HERITAGE",
    "description": "The minimalist tennis classic stripped of all excess and constructed with uncompromising luxury. Made entirely from premium thick-cut buttery calfskin leather from the exterior to the fully leather-lined interior, featuring perforated 3-Stripes and gold foil detailing.",
    "care": "Condition with premium neutral leather cream.",
    "warranty": "adidas standard footwear warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Leather Grade",
        "Thick-Cut Butter-Soft Calfskin Leather Upper"
      ],
      [
        "Lining",
        "100% Full Glove Leather Interior Lining"
      ],
      [
        "Heel Patch",
        "Reinforced Tonal Cream Leather Heel Counter"
      ],
      [
        "Cupsole",
        "Reinforced 360-Degree Stitched Rubber Court Sole"
      ]
    ],
    "variants": [
      {
        "sku": "STAN-LUX-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 1299900,
        "compareAt": null,
        "stock": 5,
        "max": 2
      },
      {
        "sku": "STAN-LUX-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 1299900,
        "compareAt": null,
        "stock": 9,
        "max": 2
      },
      {
        "sku": "STAN-LUX-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 1299900,
        "compareAt": null,
        "stock": 10,
        "max": 2
      },
      {
        "sku": "STAN-LUX-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 1299900,
        "compareAt": null,
        "stock": 4,
        "max": 2
      }
    ]
  },
  {
    "slug": "new-balance-990v6-made-in-usa-core-grey",
    "name": "New Balance 990v6 Made in USA “Core Grey”",
    "brand": "New Balance",
    "category": "sneakers-footwear",
    "titleLine1": "MADE IN USA",
    "titleLine2": "“990V6 GREY”",
    "accent": "FUELCELL ENCAP",
    "tagline": "Teddy Santis Direction with High-Rebound FuelCell Performance Foam",
    "badge": "ICONIC GRAIL",
    "description": "Handcrafted in the United States under creative director Teddy Santis. The 990v6 eliminates the standard midfoot saddle for sweeping suede overlays atop breathable mesh, pairing classic ENCAP stability with explosive FuelCell performance foam.",
    "care": "Spot clean suede with suede brush. Do not machine wash.",
    "warranty": "New Balance Made in USA quality guarantee.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1617606002779-51d866bdd1d1?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1617606002779-51d866bdd1d1?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Origin",
        "Made in USA Craftsmanship (Domestic Content >= 70%)"
      ],
      [
        "Foam",
        "FuelCell High-Rebound Dynamic Propulsion Foam"
      ],
      [
        "Support",
        "ENCAP Rim Polyurethane Midsole Support Structure"
      ],
      [
        "Upper",
        "Pigskin Suede Paneling & Breathable Mesh Underlays"
      ]
    ],
    "variants": [
      {
        "sku": "NB-990V6-UK7.5",
        "name": "UK 7.5",
        "size": "UK 7.5",
        "price": 2399900,
        "compareAt": null,
        "stock": 3,
        "max": 2
      },
      {
        "sku": "NB-990V6-UK8.5",
        "name": "UK 8.5",
        "size": "UK 8.5",
        "price": 2399900,
        "compareAt": null,
        "stock": 6,
        "max": 2
      },
      {
        "sku": "NB-990V6-UK9.5",
        "name": "UK 9.5",
        "size": "UK 9.5",
        "price": 2399900,
        "compareAt": null,
        "stock": 8,
        "max": 2
      },
      {
        "sku": "NB-990V6-UK10.5",
        "name": "UK 10.5",
        "size": "UK 10.5",
        "price": 2399900,
        "compareAt": null,
        "stock": 4,
        "max": 2
      }
    ]
  },
  {
    "slug": "new-balance-550-retro-basketball-white-green",
    "name": "New Balance 550 Retro Basketball White/Green",
    "brand": "New Balance",
    "category": "sneakers-footwear",
    "titleLine1": "RETRO 550",
    "titleLine2": "“WHITE / GREEN”",
    "accent": "1989 ARCHIVE",
    "tagline": "The 1989 Hardwood Silhouette Resurrected for Vintage Street Pavement",
    "badge": "TOP RATED",
    "description": "The 1989 basketball court original revived. Clean, simple, and honest, the 550 combines heavy-gauge premium white leather with dark green leather accents, perforated side panels, vintage cracked leather detailing, and a durable non-marking rubber cupsole.",
    "care": "Wipe with damp cloth and leather conditioner.",
    "warranty": "New Balance standard footwear warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Upper",
        "Heavy-Gauge Full-Grain White Leather & Suede Toe"
      ],
      [
        "Venting",
        "Perforated Quarter Panels for Continuous Airflow"
      ],
      [
        "Insignia",
        "Puff-Embroidered '550' Forefoot Numbering"
      ],
      [
        "Outsole",
        "Two-Tone Vintage Cream and Dark Green Rubber Cupsole"
      ]
    ],
    "variants": [
      {
        "sku": "NB-550-GRN-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 1199900,
        "compareAt": 1399900,
        "stock": 6,
        "max": 2
      },
      {
        "sku": "NB-550-GRN-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 1199900,
        "compareAt": 1399900,
        "stock": 12,
        "max": 2
      },
      {
        "sku": "NB-550-GRN-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 1199900,
        "compareAt": 1399900,
        "stock": 16,
        "max": 2
      },
      {
        "sku": "NB-550-GRN-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 1199900,
        "compareAt": 1399900,
        "stock": 11,
        "max": 2
      },
      {
        "sku": "NB-550-GRN-UK11",
        "name": "UK 11",
        "size": "UK 11",
        "price": 1199900,
        "compareAt": 1399900,
        "stock": 4,
        "max": 2
      }
    ]
  },
  {
    "slug": "new-balance-1906r-protection-pack-castlerock",
    "name": "New Balance 1906R Protection Pack “Castlerock”",
    "brand": "New Balance",
    "category": "sneakers-footwear",
    "titleLine1": "1906R",
    "titleLine2": "“PROTECTION PACK”",
    "accent": "CASTLEROCK",
    "tagline": "Deconstructed Raw-Edged Suede Shards with N-ergy Shock Absorption",
    "badge": "NEW ARRIVAL",
    "description": "The visionary deconstructed look created by designer Yue Wu. The 1906R Protection Pack features jagged, distressed raw-cut suede shards laid over durable mesh, N-lock lace integration system, and an ABZORB SBS heel pod with N-ergy shock absorption.",
    "care": "Embrace natural distressing. Spot clean mesh gently.",
    "warranty": "New Balance standard footwear warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Design Style",
        "Yue Wu 'Refined Future' Raw-Edge Suede Shards"
      ],
      [
        "Lacing",
        "N-lock Integrated Cord Harness System"
      ],
      [
        "Shock Absorption",
        "ABZORB SBS Heel Cartridge with N-ergy Web"
      ],
      [
        "Arch Support",
        "Stability Web Midfoot Torsional Shank"
      ]
    ],
    "variants": [
      {
        "sku": "NB-1906R-CR-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 1599900,
        "compareAt": null,
        "stock": 4,
        "max": 2
      },
      {
        "sku": "NB-1906R-CR-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 1599900,
        "compareAt": null,
        "stock": 7,
        "max": 2
      },
      {
        "sku": "NB-1906R-CR-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 1599900,
        "compareAt": null,
        "stock": 9,
        "max": 2
      },
      {
        "sku": "NB-1906R-CR-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 1599900,
        "compareAt": null,
        "stock": 3,
        "max": 2
      }
    ]
  },
  {
    "slug": "new-balance-2002r-protection-pack-rain-cloud",
    "name": "New Balance 2002R “Protection Pack Rain Cloud”",
    "brand": "New Balance",
    "category": "sneakers-footwear",
    "titleLine1": "2002R",
    "titleLine2": "“RAIN CLOUD”",
    "accent": "REFINED FUTURE",
    "tagline": "The Iconic Deconstructed Masterpiece in Multi-Layered Grey Suede",
    "badge": "FLAGSHIP",
    "description": "The silhouette that ignited the global Refined Future revolution. Features weathered, unevenly sliced slate and charcoal suede layers floating above open-cell mesh, exposed foam tongues, and a technical 860v2 cushioned running sole unit.",
    "care": "Store in cool environment. Use gentle suede brush.",
    "warranty": "New Balance standard footwear warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Upper",
        "Eroded Suede Overlays with Exposed Foam Accents"
      ],
      [
        "Midsole",
        "Heritage 860v2 Tooling with ABZORB Technology"
      ],
      [
        "Colorway",
        "Iconic Multi-Shade Rain Cloud / Magnet / Grey"
      ],
      [
        "Tread",
        "Full Ground Contact N-ergy High-Traction Rubber"
      ]
    ],
    "variants": [
      {
        "sku": "NB-2002R-RC-UK7.5",
        "name": "UK 7.5",
        "size": "UK 7.5",
        "price": 1699900,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "NB-2002R-RC-UK8.5",
        "name": "UK 8.5",
        "size": "UK 8.5",
        "price": 1699900,
        "compareAt": null,
        "stock": 5,
        "max": 1
      },
      {
        "sku": "NB-2002R-RC-UK9.5",
        "name": "UK 9.5",
        "size": "UK 9.5",
        "price": 1699900,
        "compareAt": null,
        "stock": 6,
        "max": 1
      },
      {
        "sku": "NB-2002R-RC-UK10.5",
        "name": "UK 10.5",
        "size": "UK 10.5",
        "price": 1699900,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "new-balance-991v2-made-in-uk-dark-navy",
    "name": "New Balance 991v2 Made in UK “Dark Navy”",
    "brand": "New Balance",
    "category": "sneakers-footwear",
    "titleLine1": "MADE IN UK",
    "titleLine2": "“991V2 FLIMBY”",
    "accent": "FUELCELL UPGRADE",
    "tagline": "Handcrafted in the Historic Flimby Factory in Cumbria, England",
    "badge": "EDITORIAL CHOICE",
    "description": "The evolution of an icon from Flimby, Cumbria. The 991v2 modernizes the 2001 classic with streamlined toe-box geometry, rich English pigskin suede in midnight navy, and full-length FuelCell cushioning paired with signature ABZORB pods.",
    "care": "Condition with English suede protector spray.",
    "warranty": "New Balance Made in UK quality guarantee.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Factory",
        "Handcrafted in Flimby, Cumbria, United Kingdom"
      ],
      [
        "Materials",
        "Locally Sourced English Pigskin Suede & Ripstop Mesh"
      ],
      [
        "Midsole",
        "Full-Length FuelCell Core with ABZORB SBS Pods"
      ],
      [
        "Tongue Badge",
        "Embroidered 'Made in England' & '991' Script"
      ]
    ],
    "variants": [
      {
        "sku": "NB-991V2-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 2599900,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "NB-991V2-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 2599900,
        "compareAt": null,
        "stock": 4,
        "max": 1
      },
      {
        "sku": "NB-991V2-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 2599900,
        "compareAt": null,
        "stock": 5,
        "max": 1
      },
      {
        "sku": "NB-991V2-UK11",
        "name": "UK 11",
        "size": "UK 11",
        "price": 2599900,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "new-balance-9060-chunky-runner-sea-salt",
    "name": "New Balance 9060 Chunky Runner “Sea Salt”",
    "brand": "New Balance",
    "category": "sneakers-footwear",
    "titleLine1": "MODEL 9060",
    "titleLine2": "“SEA SALT”",
    "accent": "Y2K SCULPTED",
    "tagline": "Warped Y2K Sci-Fi Futurism Merged with Classic 99X DNA",
    "badge": "LIMITED EDITION",
    "description": "A bold, warped reinterpretation of classic 99X Series elements influenced by the futuristic Y2K aesthetic. Sculpted dual-density midsole with ABZORB and SBS cushioning, diamond-shaped outsole traction pads, and translucent CR heel device.",
    "care": "Wipe with damp cloth and dry naturally.",
    "warranty": "New Balance standard footwear warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1562183241-b937e95585b6?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1562183241-b937e95585b6?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Heel Device",
        "Translucent Sculpted TPU CR Motion Control Bar"
      ],
      [
        "Midsole",
        "Exaggerated Dual-Density ABZORB & SBS Pods"
      ],
      [
        "Outsole",
        "Diamond-Shaped Pattern Inspired by 860 Traction"
      ],
      [
        "Upper",
        "Layered Neutral Suede Over Air Mesh Foundation"
      ]
    ],
    "variants": [
      {
        "sku": "NB-9060-SS-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 1499900,
        "compareAt": 1699900,
        "stock": 4,
        "max": 2
      },
      {
        "sku": "NB-9060-SS-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 1499900,
        "compareAt": 1699900,
        "stock": 8,
        "max": 2
      },
      {
        "sku": "NB-9060-SS-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 1499900,
        "compareAt": 1699900,
        "stock": 10,
        "max": 2
      },
      {
        "sku": "NB-9060-SS-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 1499900,
        "compareAt": 1699900,
        "stock": 5,
        "max": 2
      }
    ]
  },
  {
    "slug": "gucci-gg-supreme-monogram-canvas-bomber-jacket",
    "name": "Gucci GG Supreme Canvas Bomber Jacket",
    "brand": "Gucci",
    "category": "fashion",
    "titleLine1": "GUCCI MILANO",
    "titleLine2": "“GG SUPREME”",
    "accent": "CANVAS BOMBER",
    "tagline": "The Legendary Beige & Ebony Monogram with Iconic Green & Red Web Knit",
    "badge": "ICONIC GRAIL",
    "description": "The timeless epitome of Italian luxury. Crafted from GG Supreme coated canvas in classic beige and ebony, trimmed with signature green and red Web knitted collar, cuffs, and hem, and finished with antiqued gold-toned hardware.",
    "care": "Specialist leather and coated canvas dry clean only.",
    "warranty": "Gucci Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Canvas",
        "Low Environmental Impact GG Supreme Coated Canvas"
      ],
      [
        "Trims",
        "Signature Green and Red Web Wool Ribbed Knit"
      ],
      [
        "Lining",
        "100% Cupro Silken Interior with Interior Welt Pocket"
      ],
      [
        "Hardware",
        "Antiqued Gold-Toned Dual Zip Pullers with Gucci Engraving"
      ]
    ],
    "variants": [
      {
        "sku": "GUC-BMB-IT46",
        "name": "IT 46",
        "size": "IT 46",
        "price": 24500000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "GUC-BMB-IT48",
        "name": "IT 48",
        "size": "IT 48",
        "price": 24500000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      },
      {
        "sku": "GUC-BMB-IT50",
        "name": "IT 50",
        "size": "IT 50",
        "price": 24500000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      },
      {
        "sku": "GUC-BMB-IT52",
        "name": "IT 52",
        "size": "IT 52",
        "price": 24500000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "gucci-jordaan-leather-horsebit-loafers-black",
    "name": "Gucci Jordaan Leather Horsebit Loafers",
    "brand": "Gucci",
    "category": "fashion",
    "titleLine1": "JORDAAN",
    "titleLine2": "“HORSEBIT”",
    "accent": "CALFSKIN LOAFER",
    "tagline": "First Introduced in 1953, the Equestrian Horsebit in Supple Black Leather",
    "badge": "TOP RATED",
    "description": "The quintessential luxury loafer. Since its debut in 1953, the Gucci Horsebit loafer has combined equestrian heritage with Italian cobblestone elegance. Constructed from buttery soft black leather with a slim, elongated shape and gilded brass horsebit.",
    "care": "Treat with beeswax shoe polish. Store with wooden shoe trees.",
    "warranty": "Gucci Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Hardware",
        "Burnished Gold-Toned Gilded Brass Horsebit Clasp"
      ],
      [
        "Leather",
        "Full-Grain Italian Calfskin Leather with Natural Shine"
      ],
      [
        "Sole",
        "Hand-Stitched Leather Sole with Rubber Heel Cap"
      ],
      [
        "Construction",
        "Blake Rapid Stitching for Extreme Flexibility"
      ]
    ],
    "variants": [
      {
        "sku": "GUC-JORD-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 8200000,
        "compareAt": null,
        "stock": 3,
        "max": 2
      },
      {
        "sku": "GUC-JORD-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 8200000,
        "compareAt": null,
        "stock": 6,
        "max": 2
      },
      {
        "sku": "GUC-JORD-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 8200000,
        "compareAt": null,
        "stock": 8,
        "max": 2
      },
      {
        "sku": "GUC-JORD-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 8200000,
        "compareAt": null,
        "stock": 5,
        "max": 2
      },
      {
        "sku": "GUC-JORD-UK11",
        "name": "UK 11",
        "size": "UK 11",
        "price": 8200000,
        "compareAt": null,
        "stock": 2,
        "max": 2
      }
    ]
  },
  {
    "slug": "gucci-dionysus-small-gg-shoulder-bag",
    "name": "Gucci Dionysus Small GG Shoulder Bag",
    "brand": "Gucci",
    "category": "fashion",
    "titleLine1": "DIONYSUS",
    "titleLine2": "“SHOULDER BAG”",
    "accent": "TIGER HEAD CLASP",
    "tagline": "Mythological Greek God Tiger-Head Spur Closure in Antiqued Silver",
    "badge": "FLAGSHIP",
    "description": "Referencing the Greek god Dionysus, said to have crossed the river Tigris on a tiger sent by Zeus. Structured shoulder bag in GG Supreme canvas with taupe suede detail, sliding chain strap that can be worn multiple ways, and textured tiger head closure.",
    "care": "Protect from direct light, heat and rain. Clean with soft dry cloth.",
    "warranty": "Gucci Certificate of Authenticity and RFID Security Tag.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Closure",
        "Textured Tiger Head Spur Pin with Side Release"
      ],
      [
        "Strap",
        "Sliding Chain Strap with 38cm Drop or 22cm Double Drop"
      ],
      [
        "Interior",
        "Pocket Under the Flap & Zippered Partition Compartment"
      ],
      [
        "Dimensions",
        "W28cm x H17cm x D9cm (Small Model)"
      ]
    ],
    "variants": [
      {
        "sku": "GUC-DION-SM",
        "name": "Beige / Taupe Suede",
        "price": 21000000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      }
    ]
  },
  {
    "slug": "gucci-interlocking-g-technical-zip-track-jacket",
    "name": "Gucci Interlocking G Technical Zip Jacket",
    "brand": "Gucci",
    "category": "fashion",
    "titleLine1": "INTERLOCKING G",
    "titleLine2": "“TRACK JACKET”",
    "accent": "TECHNICAL JERSEY",
    "tagline": "Retro 1980s Italian Athleisure with Jacquard Monogram Sleeve Sleeves",
    "badge": "NEW ARRIVAL",
    "description": "Capturing the vibrant nostalgia of vintage athletic sportswear. Made in Italy from heavyweight technical jersey, featuring contrast white zip, ribbed stand collar, and jacquard Web stripe tape running down both sleeves with the Interlocking G motif.",
    "care": "Dry clean or hand wash delicate cold. Do not iron print.",
    "warranty": "Gucci Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Material",
        "55% Polyester, 45% Cotton Heavyweight Technical Jersey"
      ],
      [
        "Tape Detail",
        "Jacquard Interlocking G Web Stripe Sleeve Inset"
      ],
      [
        "Collar",
        "Elasticized High Stand Ribbed Wind Collar"
      ],
      [
        "Pockets",
        "Side Zip Pockets with Enamel Pullers"
      ]
    ],
    "variants": [
      {
        "sku": "GUC-TRK-S",
        "name": "S",
        "size": "S",
        "price": 15500000,
        "compareAt": 17500000,
        "stock": 3,
        "max": 2
      },
      {
        "sku": "GUC-TRK-M",
        "name": "M",
        "size": "M",
        "price": 15500000,
        "compareAt": 17500000,
        "stock": 5,
        "max": 2
      },
      {
        "sku": "GUC-TRK-L",
        "name": "L",
        "size": "L",
        "price": 15500000,
        "compareAt": 17500000,
        "stock": 6,
        "max": 2
      },
      {
        "sku": "GUC-TRK-XL",
        "name": "XL",
        "size": "XL",
        "price": 15500000,
        "compareAt": 17500000,
        "stock": 2,
        "max": 2
      }
    ]
  },
  {
    "slug": "gucci-princetown-leather-mules-black",
    "name": "Gucci Princetown Leather Slippers / Mules",
    "brand": "Gucci",
    "category": "fashion",
    "titleLine1": "PRINCETOWN",
    "titleLine2": "“LEATHER MULE”",
    "accent": "BACKLESS SLIPPER",
    "tagline": "The Modern Cult Phenomenon with Polished Gold-Toned Horsebit",
    "badge": "EDITORIAL CHOICE",
    "description": "The slip-on sensation that transformed modern luxury dressing. An unconventional backless design crafted from smooth black Italian leather, adorned with the iconic horsebit across the vamp, leather sole, and heart-shaped leather insole detail.",
    "care": "Wipe clean with soft damp cloth. Store with protective dust covers.",
    "warranty": "Gucci Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Style",
        "Backless Slip-On Loafer Mule"
      ],
      [
        "Insole",
        "Padded Leather Lining with Stitched Heart Appliqué"
      ],
      [
        "Hardware",
        "Polished 18K Yellow Gold-Toned Horsebit"
      ],
      [
        "Sole",
        "10mm Natural Leather Sole with Rubber Heel Tap"
      ]
    ],
    "variants": [
      {
        "sku": "GUC-PRIN-UK6",
        "name": "UK 6",
        "size": "UK 6",
        "price": 7800000,
        "compareAt": null,
        "stock": 3,
        "max": 2
      },
      {
        "sku": "GUC-PRIN-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 7800000,
        "compareAt": null,
        "stock": 5,
        "max": 2
      },
      {
        "sku": "GUC-PRIN-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 7800000,
        "compareAt": null,
        "stock": 7,
        "max": 2
      },
      {
        "sku": "GUC-PRIN-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 7800000,
        "compareAt": null,
        "stock": 6,
        "max": 2
      },
      {
        "sku": "GUC-PRIN-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 7800000,
        "compareAt": null,
        "stock": 2,
        "max": 2
      }
    ]
  },
  {
    "slug": "gucci-gg-jacquard-wool-and-silk-scarf",
    "name": "Gucci GG Jacquard Wool & Silk Scarf",
    "brand": "Gucci",
    "category": "fashion",
    "titleLine1": "GUCCI GG",
    "titleLine2": "“JACQUARD SCARF”",
    "accent": "WOOL & SILK",
    "tagline": "Reversible Two-Tone Jacquard Scarf Finished with Delicate Raw Fringe",
    "badge": "LIMITED EDITION",
    "description": "An essential emblem of Maison Gucci craftsmanship. Woven in Italy from an ultra-soft blend of 90% fine wool and 10% silk, featuring the historic 1970s GG pattern on one side and a reverse contrast pattern on the other, edged in raw eyelash fringe.",
    "care": "Dry clean only. Do not wash or bleach.",
    "warranty": "Gucci Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Composition",
        "90% Fine Wool, 10% Mulberry Silk"
      ],
      [
        "Dimensions",
        "35cm Width x 180cm Length"
      ],
      [
        "Weave",
        "Double-Faced Reversible Jacquard GG Monogram"
      ],
      [
        "Edges",
        "Frayed Eyelash Fringe Border on Both Ends"
      ]
    ],
    "variants": [
      {
        "sku": "GUC-SCARF-GG",
        "name": "Grey / Soft Pink",
        "price": 3800000,
        "compareAt": null,
        "stock": 8,
        "max": 2
      }
    ]
  },
  {
    "slug": "balenciaga-triple-s-clear-sole-sneaker-white-grey",
    "name": "Balenciaga Triple S Clear Sole Sneaker",
    "brand": "Balenciaga",
    "category": "fashion",
    "titleLine1": "TRIPLE S",
    "titleLine2": "“CLEAR SOLE”",
    "accent": "DEMNA GVASALIA",
    "tagline": "The Catalyst of the Chunky Dad-Shoe Phenomenon with Injected Air Unit",
    "badge": "ICONIC GRAIL",
    "description": "Demna's boundary-shattering chunky sneaker that redefined global fashion proportions. Featuring a complex three-layered sole mold derived from running, basketball, and track shoes, TPU clear sole bubble, washed mesh and leather upper, and embroidered toe size.",
    "care": "Wipe with soft cloth. Do not immerse air unit in harsh solvents.",
    "warranty": "Balenciaga Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Sole Structure",
        "Complex 3-Layered Stacked Sole with TPU Clear Bubble"
      ],
      [
        "Toe Embroidery",
        "Contrast Embroidered Shoe Size on the Forefoot Edge"
      ],
      [
        "Lacing",
        "Bicolor Hiking-Inspired Thick Athletic Laces"
      ],
      [
        "Weight",
        "Substantial Solid Stance (~850g per shoe)"
      ]
    ],
    "variants": [
      {
        "sku": "BAL-3S-CLR-EU40",
        "name": "EU 40",
        "size": "EU 40",
        "price": 8900000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "BAL-3S-CLR-EU41",
        "name": "EU 41",
        "size": "EU 41",
        "price": 8900000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      },
      {
        "sku": "BAL-3S-CLR-EU42",
        "name": "EU 42",
        "size": "EU 42",
        "price": 8900000,
        "compareAt": null,
        "stock": 6,
        "max": 1
      },
      {
        "sku": "BAL-3S-CLR-EU43",
        "name": "EU 43",
        "size": "EU 43",
        "price": 8900000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      },
      {
        "sku": "BAL-3S-CLR-EU44",
        "name": "EU 44",
        "size": "EU 44",
        "price": 8900000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "balenciaga-speed-2-0-recycled-knit-sock-sneaker",
    "name": "Balenciaga Speed 2.0 Recycled Knit Sneaker",
    "brand": "Balenciaga",
    "category": "fashion",
    "titleLine1": "SPEED 2.0",
    "titleLine2": "“SOCK SNEAKER”",
    "accent": "RECYCLED KNIT",
    "tagline": "Ultra-Flexible Articulated Sole with 3D Technical Sock Upper",
    "badge": "TOP RATED",
    "description": "The minimalist sock sneaker that feels like barefoot weightlessness. Featuring 3D technical recycled knit construction, white contrast Balenciaga logo print on the lateral side, and an ultra-flexible molded five-segment ergonomic sole unit.",
    "care": "Machine wash cold delicate inside shoe pouch. Air dry flat.",
    "warranty": "Balenciaga Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Weight",
        "Barely-There 240g Ultra-Lightweight Build"
      ],
      [
        "Sole",
        "Ergonomic 5-Segment Articulated Sole with 'No Memory' Tech"
      ],
      [
        "Upper",
        "Breathable 3D Technical Recycled Stretch Knit"
      ],
      [
        "Insole",
        "Removable Antimicrobial Moisture-Wicking Footbed"
      ]
    ],
    "variants": [
      {
        "sku": "BAL-SPEED2-EU40",
        "name": "EU 40",
        "size": "EU 40",
        "price": 7600000,
        "compareAt": 8600000,
        "stock": 3,
        "max": 2
      },
      {
        "sku": "BAL-SPEED2-EU41",
        "name": "EU 41",
        "size": "EU 41",
        "price": 7600000,
        "compareAt": 8600000,
        "stock": 5,
        "max": 2
      },
      {
        "sku": "BAL-SPEED2-EU42",
        "name": "EU 42",
        "size": "EU 42",
        "price": 7600000,
        "compareAt": 8600000,
        "stock": 7,
        "max": 2
      },
      {
        "sku": "BAL-SPEED2-EU43",
        "name": "EU 43",
        "size": "EU 43",
        "price": 7600000,
        "compareAt": 8600000,
        "stock": 3,
        "max": 2
      }
    ]
  },
  {
    "slug": "balenciaga-oversized-tape-type-fleece-hoodie",
    "name": "Balenciaga Oversized Tape Type Fleece Hoodie",
    "brand": "Balenciaga",
    "category": "fashion",
    "titleLine1": "BALENCIAGA",
    "titleLine2": "“TAPE TYPE”",
    "accent": "OVERSIZED HOODIE",
    "tagline": "Heavyweight French Terry Cotton with Trompe-L'œil Tape Branding",
    "badge": "NEW ARRIVAL",
    "description": "The archetype of Parisian luxury streetwear. Cut in Balenciaga's exaggerated oversized silhouette from 450gsm heavyweight organic French terry cotton, featuring industrial masking-tape graphic typography stamped across the chest and back.",
    "care": "Machine wash cold inside out. Reshape while damp. Do not tumble dry.",
    "warranty": "Balenciaga Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Fabric",
        "100% Heavyweight Organic Cotton French Terry (450 GSM)"
      ],
      [
        "Silhouette",
        "Exaggerated Dropped Shoulder Cocoon Oversize Fit"
      ],
      [
        "Graphics",
        "Weathered Trompe-L'œil Masking Tape Print"
      ],
      [
        "Details",
        "Kangaroo Front Pouch & Gathered Cuffs without Drawstrings"
      ]
    ],
    "variants": [
      {
        "sku": "BAL-HOOD-TAPE-XS",
        "name": "XS",
        "size": "XS",
        "price": 8500000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "BAL-HOOD-TAPE-S",
        "name": "S",
        "size": "S",
        "price": 8500000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      },
      {
        "sku": "BAL-HOOD-TAPE-M",
        "name": "M",
        "size": "M",
        "price": 8500000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      },
      {
        "sku": "BAL-HOOD-TAPE-L",
        "name": "L",
        "size": "L",
        "price": 8500000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "balenciaga-hourglass-xs-grained-leather-bag",
    "name": "Balenciaga Hourglass XS Grained Leather Bag",
    "brand": "Balenciaga",
    "category": "fashion",
    "titleLine1": "HOURGLASS XS",
    "titleLine2": "“TOP HANDLE”",
    "accent": "CURVILINEAR BASE",
    "tagline": "Architectural Concave Base Homage to Cristóbal Balenciaga's Tailoring",
    "badge": "FLAGSHIP",
    "description": "Honoring founder Cristóbal Balenciaga's iconic Basque waistline tailoring. The Hourglass features a dramatic curvilinear crescent bottom, structured trapezoidal top, magnet closure with hanging ruthenium B hardware, and adjustable cross-body strap.",
    "care": "Wipe with soft, dry natural leather cloth. Store upright.",
    "warranty": "Balenciaga Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Base Shape",
        "Curvilinear Crescent Architectural Concave Base"
      ],
      [
        "Leather",
        "Grained Shiny Box Calfskin with Scratch Resistance"
      ],
      [
        "Hardware",
        "Matte Black or Ruthenium B Magnet Drop Charm"
      ],
      [
        "Dimensions",
        "W19cm x H13cm x D8cm with 55cm Crossbody Strap"
      ]
    ],
    "variants": [
      {
        "sku": "BAL-HG-XS-BLK",
        "name": "Black Grained Leather",
        "price": 19500000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "balenciaga-track-sneaker-faded-black",
    "name": "Balenciaga Track Sneaker Faded Black",
    "brand": "Balenciaga",
    "category": "fashion",
    "titleLine1": "BALENCIAGA",
    "titleLine2": "“TRACK SNEAKER”",
    "accent": "96 TECHNICAL PANELS",
    "tagline": "High-Tech High-Fashion Trail Hiking Hybrid with Interlaced Cage",
    "badge": "EDITORIAL CHOICE",
    "description": "An engineering triumph composed of 96 individual overlapping technical components. Blending high-performance hiking and running aesthetics with dynamic caged upper, round double laces, vintage faded patina, and augmented back sole.",
    "care": "Clean panels with soft toothbrush and mild soap foam.",
    "warranty": "Balenciaga Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Panel Complexity",
        "Over 96 Overlapping High-Tech Injected Panels"
      ],
      [
        "Laces",
        "Double Intertwined Hiking Round Lace Harness"
      ],
      [
        "Midsole",
        "Dynamic Cushioning Multi-Density EVA Core"
      ],
      [
        "Traction",
        "Outdoor Lugged Tread with Reinforced Heel Bumper"
      ]
    ],
    "variants": [
      {
        "sku": "BAL-TRK-FAD-EU41",
        "name": "EU 41",
        "size": "EU 41",
        "price": 9200000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "BAL-TRK-FAD-EU42",
        "name": "EU 42",
        "size": "EU 42",
        "price": 9200000,
        "compareAt": null,
        "stock": 5,
        "max": 1
      },
      {
        "sku": "BAL-TRK-FAD-EU43",
        "name": "EU 43",
        "size": "EU 43",
        "price": 9200000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      },
      {
        "sku": "BAL-TRK-FAD-EU44",
        "name": "EU 44",
        "size": "EU 44",
        "price": 9200000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "balenciaga-strike-combat-leather-ankle-boot",
    "name": "Balenciaga Strike Combat Leather Ankle Boot",
    "brand": "Balenciaga",
    "category": "fashion",
    "titleLine1": "STRIKE 20MM",
    "titleLine2": "“COMBAT BOOT”",
    "accent": "DISTRESSED LEATHER",
    "tagline": "Industrial Military Utilitarianism with Exaggerated Cleated Lug Sole",
    "badge": "LIMITED EDITION",
    "description": "A commanding statement in military-inspired luxury. Crafted from distressed matte black calfskin leather with weathered toe and heel finishing, heavy-duty 8-eyelet lace closure, embossed Balenciaga logo on the vamp, and an aggressive 20mm cleated lug sole.",
    "care": "Condition with black boot balm. Keep away from deep puddles.",
    "warranty": "Balenciaga Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Lug Height",
        "20mm Aggressive Deep-Tread Cleated Rubber Lug Sole"
      ],
      [
        "Upper",
        "Heavy-Duty Matt Black Calfskin with Hand-Applied Distressing"
      ],
      [
        "Closure",
        "8-Eyelet Gunmetal Lacing System with Top Speed Hooks"
      ],
      [
        "Insignia",
        "Embossed Balenciaga Wordmark on Forefoot & Heel Tab"
      ]
    ],
    "variants": [
      {
        "sku": "BAL-STRK-EU40",
        "name": "EU 40",
        "size": "EU 40",
        "price": 11500000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "BAL-STRK-EU41",
        "name": "EU 41",
        "size": "EU 41",
        "price": 11500000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      },
      {
        "sku": "BAL-STRK-EU42",
        "name": "EU 42",
        "size": "EU 42",
        "price": 11500000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      },
      {
        "sku": "BAL-STRK-EU43",
        "name": "EU 43",
        "size": "EU 43",
        "price": 11500000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "prada-re-nylon-gabardine-padded-jacket",
    "name": "Prada Re-Nylon Gabardine Padded Jacket",
    "brand": "Prada",
    "category": "fashion",
    "titleLine1": "PRADA MILANO",
    "titleLine2": "“RE-NYLON JACKET”",
    "accent": "ENAMEL TRIANGLE",
    "tagline": "Sustainable Regenerated Ocean Nylon with Iconic Enameled Triangle Logo",
    "badge": "ICONIC GRAIL",
    "description": "Pioneering industrial luxury since Miuccia Prada debuted Pocone nylon. Crafted from innovative Re-Nylon—a regenerated yarn produced from recycled ocean plastic waste—padded with goose down, finished with shirt-style collar, and iconic enameled metal triangle logo.",
    "care": "Dry clean delicate with hydrocarbon solvents only.",
    "warranty": "Prada Authenticity Certificate & RFID Authenticated.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Material",
        "100% Regenerated Re-Nylon from Purified Ocean Plastic"
      ],
      [
        "Insulation",
        "90/10 White Goose Down & Feather Fill (High Loft)"
      ],
      [
        "Insignia",
        "Sartorial Enameled Metal Triangle Logo on Chest Pocket"
      ],
      [
        "Pockets",
        "Flap Breast Pocket with Internal Welt Storage"
      ]
    ],
    "variants": [
      {
        "sku": "PRD-RN-JCK-IT46",
        "name": "IT 46",
        "size": "IT 46",
        "price": 21500000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "PRD-RN-JCK-IT48",
        "name": "IT 48",
        "size": "IT 48",
        "price": 21500000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      },
      {
        "sku": "PRD-RN-JCK-IT50",
        "name": "IT 50",
        "size": "IT 50",
        "price": 21500000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      },
      {
        "sku": "PRD-RN-JCK-IT52",
        "name": "IT 52",
        "size": "IT 52",
        "price": 21500000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "prada-monolith-brushed-leather-lug-boots-pouch",
    "name": "Prada Monolith Brushed Leather Combat Boots with Pouch",
    "brand": "Prada",
    "category": "fashion",
    "titleLine1": "MONOLITH",
    "titleLine2": "“POUCH BOOTS”",
    "accent": "55MM LUG SOLE",
    "tagline": "Extreme Volumetric Lug Sole with Removable Nylon Ankle Pouches",
    "badge": "FLAGSHIP",
    "description": "The monolithic footwear sensation that took the fashion world by storm. Built from mirror-polished brushed calf leather, featuring a dramatic 55mm block tread sole, lace-up front, and signature detachable Re-Nylon utility pouches strapped around each ankle.",
    "care": "Clean brushed leather with soft cloth. Remove pouches before wet conditions.",
    "warranty": "Prada Authenticity Certificate.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Sole",
        "55mm Monolithic Lightweight Expanded Rubber Lug Tread"
      ],
      [
        "Leather",
        "Spazzolato High-Sheen Brushed Italian Calfskin"
      ],
      [
        "Accessories",
        "Detachable Re-Nylon Ankle Pouches with Triangle Plates"
      ],
      [
        "Closure",
        "Tonal Lace-Up with Side Inseam Zipper for Quick Entry"
      ]
    ],
    "variants": [
      {
        "sku": "PRD-MONO-EU39",
        "name": "EU 39",
        "size": "EU 39",
        "price": 14500000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "PRD-MONO-EU40",
        "name": "EU 40",
        "size": "EU 40",
        "price": 14500000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      },
      {
        "sku": "PRD-MONO-EU41",
        "name": "EU 41",
        "size": "EU 41",
        "price": 14500000,
        "compareAt": null,
        "stock": 5,
        "max": 1
      },
      {
        "sku": "PRD-MONO-EU42",
        "name": "EU 42",
        "size": "EU 42",
        "price": 14500000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      },
      {
        "sku": "PRD-MONO-EU43",
        "name": "EU 43",
        "size": "EU 43",
        "price": 14500000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "prada-chocolate-brushed-leather-loafers-black",
    "name": "Prada Chocolate Brushed Leather Loafers",
    "brand": "Prada",
    "category": "fashion",
    "titleLine1": "CHOCOLATE",
    "titleLine2": "“BRUSHED LOAFER”",
    "accent": "MODERN PENNY",
    "tagline": "Sublime Rounded Silhouette with Enameled Triangle Logo Penny Saddle",
    "badge": "TOP RATED",
    "description": "Reinterpreting the classic collegiate penny loafer through Prada's modernist lens. Constructed from immaculate spazzolato brushed calf leather with stitched raised apron, rounded toe, robust rubber sole, and the instantly recognizable enameled triangle plaque.",
    "care": "Polish with neutral cream for brushed leather. Store with cedar trees.",
    "warranty": "Prada Authenticity Certificate.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Leather",
        "Signature Spazzolato High-Gloss Brushed Calfskin"
      ],
      [
        "Plaque",
        "Enameled Brass Triangle Inset into the Cutout Saddle"
      ],
      [
        "Sole",
        "40mm Thick Molded Lightweight Monobloc Rubber Sole"
      ],
      [
        "Interior",
        "Gold Foil Stamped Soft Calf Leather Insole"
      ]
    ],
    "variants": [
      {
        "sku": "PRD-CHOC-UK6",
        "name": "UK 6",
        "size": "UK 6",
        "price": 9500000,
        "compareAt": null,
        "stock": 3,
        "max": 2
      },
      {
        "sku": "PRD-CHOC-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 9500000,
        "compareAt": null,
        "stock": 7,
        "max": 2
      },
      {
        "sku": "PRD-CHOC-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 9500000,
        "compareAt": null,
        "stock": 9,
        "max": 2
      },
      {
        "sku": "PRD-CHOC-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 9500000,
        "compareAt": null,
        "stock": 6,
        "max": 2
      },
      {
        "sku": "PRD-CHOC-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 9500000,
        "compareAt": null,
        "stock": 2,
        "max": 2
      }
    ]
  },
  {
    "slug": "prada-saffiano-leather-document-case-briefcase",
    "name": "Prada Saffiano Leather Document Case Briefcase",
    "brand": "Prada",
    "category": "fashion",
    "titleLine1": "SAFFIANO",
    "titleLine2": "“WORK BRIEFCASE”",
    "accent": "CROSSHATCH LEATHER",
    "tagline": "Patented Scratch-Resistant Crosshatch Calfskin for the Modern Executive",
    "badge": "EDITORIAL CHOICE",
    "description": "Patented by Mario Prada in 1913. Saffiano leather is synonymous with luxury durability, treated with a wax-press crosshatch pattern that repels scratches and rain. This sleek business case features two leather handles, removable shoulder strap, and padded laptop sleeve.",
    "care": "Wipe with damp cloth. Extremely durable and moisture resistant.",
    "warranty": "Prada Authenticity Certificate.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Material",
        "Patented Saffiano Crosshatch Treated Calfskin"
      ],
      [
        "Interior",
        "Prada Monogram Jacquard Lining with Tech Compartment"
      ],
      [
        "Hardware",
        "Polished Steel Hardware and Padlock Leather Clochette"
      ],
      [
        "Dimensions",
        "38cm Width x 28cm Height x 6.5cm Depth"
      ]
    ],
    "variants": [
      {
        "sku": "PRD-SAF-BRIEF",
        "name": "Nero Black Saffiano",
        "price": 26000000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      }
    ]
  },
  {
    "slug": "prada-re-edition-2005-re-nylon-shoulder-bag",
    "name": "Prada Re-Edition 2005 Re-Nylon Shoulder Bag",
    "brand": "Prada",
    "category": "fashion",
    "titleLine1": "RE-EDITION 2005",
    "titleLine2": "“SHOULDER BAG”",
    "accent": "CHAIN & STRAP",
    "tagline": "The Multi-Functional 2000s Y2K Icon Recreated in Sustainable Re-Nylon",
    "badge": "NEW ARRIVAL",
    "description": "Reviving the iconic 2005 silhouette. Features removable chain handle, adjustable woven tape shoulder strap with removable zip pouch, Saffiano leather trim, enameled metal triangle logo, and signature Prada Re-Edition removable leather key ring.",
    "care": "Spot clean nylon with warm damp cloth.",
    "warranty": "Prada Authenticity Certificate.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Modularity",
        "Detachable Chain Strap + Crossbody Strap + Coin Pouch"
      ],
      [
        "Trims",
        "Saffiano Leather Edges, Pullers and Re-Edition Keychain"
      ],
      [
        "Fabric",
        "Purified Re-Nylon Regenerated Marine Fibre"
      ],
      [
        "Dimensions",
        "22cm Width x 18cm Height x 6.5cm Depth"
      ]
    ],
    "variants": [
      {
        "sku": "PRD-RE2005-BLK",
        "name": "Black Re-Nylon",
        "price": 13500000,
        "compareAt": 15000000,
        "stock": 4,
        "max": 1
      }
    ]
  },
  {
    "slug": "prada-triangle-logo-tailored-cotton-poplin-shirt",
    "name": "Prada Triangle Logo Tailored Poplin Shirt",
    "brand": "Prada",
    "category": "fashion",
    "titleLine1": "PRADA TAILOR",
    "titleLine2": "“POPLIN SHIRT”",
    "accent": "CRISP COTTON",
    "tagline": "Immaculate Milanese Shirting with Fabric-Backed Triangle Chest Patch",
    "badge": "LIMITED EDITION",
    "description": "The cornerstone of refined modern dressing. Cut from crisp high-density Italian cotton poplin with mother-of-pearl buttons, structured spread collar, clean French cuffs, and the minimalist fabric triangle patch subtly positioned on the breast pocket.",
    "care": "Machine wash delicate cold or dry clean. Warm iron.",
    "warranty": "Prada Authenticity Certificate.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Fabric",
        "100% Long-Staple Egyptian Cotton Poplin (120/2 Count)"
      ],
      [
        "Buttons",
        "Genuine Smoked Mother-of-Pearl Cross-Stitched Buttons"
      ],
      [
        "Pocket",
        "Patch Breast Pocket with Tonal Sartorial Triangle"
      ],
      [
        "Collar",
        "Modern Italian Spread Collar with Removable Stays"
      ]
    ],
    "variants": [
      {
        "sku": "PRD-SHT-39",
        "name": "39 (15.5)",
        "size": "39 (15.5)",
        "price": 6800000,
        "compareAt": null,
        "stock": 3,
        "max": 2
      },
      {
        "sku": "PRD-SHT-40",
        "name": "40 (15.75)",
        "size": "40 (15.75)",
        "price": 6800000,
        "compareAt": null,
        "stock": 6,
        "max": 2
      },
      {
        "sku": "PRD-SHT-41",
        "name": "41 (16.0)",
        "size": "41 (16.0)",
        "price": 6800000,
        "compareAt": null,
        "stock": 6,
        "max": 2
      },
      {
        "sku": "PRD-SHT-42",
        "name": "42 (16.5)",
        "size": "42 (16.5)",
        "price": 6800000,
        "compareAt": null,
        "stock": 2,
        "max": 2
      }
    ]
  },
  {
    "slug": "louis-vuitton-keepall-bandouliere-50-monogram-eclipse",
    "name": "Louis Vuitton Keepall Bandoulière 50 Monogram Eclipse",
    "brand": "Louis Vuitton",
    "category": "fashion",
    "titleLine1": "KEEPALL 50",
    "titleLine2": "“BANDOULIÈRE”",
    "accent": "MONOGRAM ECLIPSE",
    "tagline": "The Essential Luxury Travel Duffle in Modern Shadowy Charcoal Canvas",
    "badge": "ICONIC GRAIL",
    "description": "An icon since 1930, the Keepall embodies the art of luxury travel. Rendered in contemporary black and grey Monogram Eclipse coated canvas, this cabin-size duffle features cowhide leather handles, removable shoulder strap, padlock with keys, and generous interior volume.",
    "care": "Wipe with soft cloth. Avoid prolonged sunlight and damp storage.",
    "warranty": "Louis Vuitton Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Canvas",
        "Monogram Eclipse Coated Canvas with Cowhide Leather Trims"
      ],
      [
        "Dimensions",
        "50cm Length x 29cm Height x 23cm Width (Cabin Size)"
      ],
      [
        "Hardware",
        "Ruthenium-Finish Metallic Padlock and Key Bell"
      ],
      [
        "Strap",
        "Removable Adjustable Shoulder Strap with Shoulder Pad"
      ]
    ],
    "variants": [
      {
        "sku": "LV-KEEP50-ECL",
        "name": "Monogram Eclipse",
        "price": 22500000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      }
    ]
  },
  {
    "slug": "louis-vuitton-christopher-pm-backpack-damier-graphite",
    "name": "Louis Vuitton Christopher PM Backpack Damier Graphite",
    "brand": "Louis Vuitton",
    "category": "fashion",
    "titleLine1": "CHRISTOPHER PM",
    "titleLine2": "“DAMIER GRAPHITE”",
    "accent": "HIKING INSPIRED",
    "tagline": "Rugged Hiking Spirit Reimagined in Urban Parisian Damier Canvas",
    "badge": "TOP RATED",
    "description": "Evoking the rugged charm of classic hiking knapsacks with haute couture sophistication. Rendered in Damier Graphite canvas with cowhide leather trims, twin front side pockets, drawstring and press-stud flap closure, and dedicated tablet compartment.",
    "care": "Store with interior stuffing to maintain architectural profile.",
    "warranty": "Louis Vuitton Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Dimensions",
        "38cm Length x 44cm Height x 12.5cm Width"
      ],
      [
        "Canvas",
        "Damier Graphite Coated Canvas with Matte Black Leather Trims"
      ],
      [
        "Closure",
        "Top Flap with Press-Stud Leather Straps & Cord Drawstring"
      ],
      [
        "Compartments",
        "Two Exterior Flap Pockets, Interior iPad & Zip Pockets"
      ]
    ],
    "variants": [
      {
        "sku": "LV-CHRIS-DG",
        "name": "Damier Graphite",
        "price": 28500000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "louis-vuitton-lv-trainer-sneaker-calfskin-green-white",
    "name": "Louis Vuitton LV Trainer Sneaker Calfskin Green/White",
    "brand": "Louis Vuitton",
    "category": "fashion",
    "titleLine1": "LV TRAINER",
    "titleLine2": "“VIRGIL ABLOH”",
    "accent": "VINTAGE BASKETBALL",
    "tagline": "Virgil Abloh's Masterpiece Requiring 7 Hours of Artisan Stitching",
    "badge": "FLAGSHIP",
    "description": "Designed by Virgil Abloh, taking inspiration from vintage basketball sneakers. Each pair requires seven hours of meticulous hand-stitching in Fiesso d'Artico, Italy. Built from supple green and white calf leather, embellished with Monogram flowers on the midsole.",
    "care": "Clean leather with foam cleanser. Store in separate LV dust covers.",
    "warranty": "Louis Vuitton Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Handcraft",
        "7 Hours of Artisan Hand-Stitching per Pair in Italy"
      ],
      [
        "Leather",
        "Premium Bi-Color Grained & Smooth Calf Leather"
      ],
      [
        "Outsole",
        "Rubber Outsole Injected with Micro Monogram Flowers"
      ],
      [
        "Insignia",
        "Louis Vuitton Handwritten Script on the Lateral Side"
      ]
    ],
    "variants": [
      {
        "sku": "LV-TRN-GRN-UK7",
        "name": "UK 7",
        "size": "UK 7",
        "price": 11800000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "LV-TRN-GRN-UK8",
        "name": "UK 8",
        "size": "UK 8",
        "price": 11800000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      },
      {
        "sku": "LV-TRN-GRN-UK9",
        "name": "UK 9",
        "size": "UK 9",
        "price": 11800000,
        "compareAt": null,
        "stock": 5,
        "max": 1
      },
      {
        "sku": "LV-TRN-GRN-UK10",
        "name": "UK 10",
        "size": "UK 10",
        "price": 11800000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      },
      {
        "sku": "LV-TRN-GRN-UK11",
        "name": "UK 11",
        "size": "UK 11",
        "price": 11800000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "louis-vuitton-horizon-55-rolling-cabin-luggage",
    "name": "Louis Vuitton Horizon 55 Rolling Cabin Luggage",
    "brand": "Louis Vuitton",
    "category": "fashion",
    "titleLine1": "HORIZON 55",
    "titleLine2": "“MARC NEWSON”",
    "accent": "WIDE CANE HANDLE",
    "tagline": "Industrial Design Revolution with Completely Flat Internal Packing Volume",
    "badge": "EDITORIAL CHOICE",
    "description": "Designed by visionary industrial designer Marc Newson. The Horizon 55 features an external wide cane pull handle that eliminates the internal ridges of traditional luggage, yielding completely flat interior packing space in an ultra-lightweight composite shell.",
    "care": "Wipe canvas shell with soft damp cloth. Store with luggage cover.",
    "warranty": "Louis Vuitton 5-year international luggage warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Designer",
        "Marc Newson Bespoke External Cane Architecture"
      ],
      [
        "Wheels",
        "4 Compact Ultra-Silent Multi-Directional Wheels"
      ],
      [
        "Security",
        "TSA-Approved Combination Padlock Built In"
      ],
      [
        "Weight & Size",
        "Cabin Size 55x38x21cm, Ultra-Lightweight 3.2kg"
      ]
    ],
    "variants": [
      {
        "sku": "LV-HORIZ-55-ECL",
        "name": "Monogram Eclipse / 55cm",
        "price": 29500000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "louis-vuitton-multiple-wallet-monogram-eclipse",
    "name": "Louis Vuitton Multiple Wallet Monogram Eclipse",
    "brand": "Louis Vuitton",
    "category": "fashion",
    "titleLine1": "MULTIPLE",
    "titleLine2": "“WALLET”",
    "accent": "POCKET COMPACT",
    "tagline": "Practical Compact Bifold Architecture with 5 Credit Card Slots",
    "badge": "NEW ARRIVAL",
    "description": "Named for its multitude of slots and compartments. A slim, elegant bifold pocket wallet crafted from durable Monogram Eclipse canvas with cowhide leather lining, easily fitting into any suit jacket or trouser pocket without bulk.",
    "care": "Keep away from oily substances or abrasive surfaces.",
    "warranty": "Louis Vuitton Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Dimensions",
        "11.5cm Length x 9.0cm Height x 1.5cm Thickness"
      ],
      [
        "Card Slots",
        "3 Credit Card Slots + 2 Business Card Pockets"
      ],
      [
        "Compartments",
        "2 Compartments for Banknotes & Currency + 2 Side Slots"
      ],
      [
        "Lining",
        "Cross-Grain Grained Black Cowhide Leather"
      ]
    ],
    "variants": [
      {
        "sku": "LV-MULT-WLT",
        "name": "Monogram Eclipse",
        "price": 4550000,
        "compareAt": null,
        "stock": 8,
        "max": 2
      }
    ]
  },
  {
    "slug": "louis-vuitton-embroidered-wool-leather-varsity-blouson",
    "name": "Louis Vuitton Embroidered Varsity Blouson",
    "brand": "Louis Vuitton",
    "category": "fashion",
    "titleLine1": "LV RUNWAY",
    "titleLine2": "“VARSITY BLOUSON”",
    "accent": "WOOL & GRAINED CALF",
    "tagline": "Haute Couture College Silhouette with Hand-Embroidered Chenille Patches",
    "badge": "LIMITED EDITION",
    "description": "A monumental runway statement piece. Features a deep navy felted wool body contrasted by supple white grained calfskin sleeves, adorned with artisanal chenille embroidery patches, LV panther mascot, striped ribbed trims, and pearl snap buttons.",
    "care": "Specialist luxury leather & fur dry clean only.",
    "warranty": "Louis Vuitton Runway Certificate of Origin.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Body Material",
        "100% Heavyweight Felted Virgin Melton Wool"
      ],
      [
        "Sleeves",
        "100% Genuine Full-Grain Italian Supple Calf Leather"
      ],
      [
        "Patches",
        "Hand-Embroidered Chenille & Chain-Stitched Graphics"
      ],
      [
        "Snaps",
        "Custom Enamel & Pearlescent Inlaid Snap Closures"
      ]
    ],
    "variants": [
      {
        "sku": "LV-VAR-IT48",
        "name": "IT 48",
        "size": "IT 48",
        "price": 46000000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      },
      {
        "sku": "LV-VAR-IT50",
        "name": "IT 50",
        "size": "IT 50",
        "price": 46000000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "LV-VAR-IT52",
        "name": "IT 52",
        "size": "IT 52",
        "price": 46000000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "dior-b23-high-top-sneaker-dior-oblique-canvas",
    "name": "Dior B23 High-Top Sneaker in Dior Oblique",
    "brand": "Dior",
    "category": "fashion",
    "titleLine1": "DIOR B23",
    "titleLine2": "“HIGH-TOP”",
    "accent": "OBLIQUE TRANSPARENT",
    "tagline": "Kim Jones Architectural High-Top with Clear Mesh Overlay Layers",
    "badge": "ICONIC GRAIL",
    "description": "Kim Jones' celebrated fusion of couture codes and skate silhouettes. Featuring black and white Dior Oblique technical canvas layered beneath translucent technical overlays, patchwork white rubber sole with DIOR side signature, and back pull tab.",
    "care": "Wipe with soft cloth. Avoid abrasive scrubbing on clear overlay.",
    "warranty": "Christian Dior Couture Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Canvas",
        "Woven Dior Oblique Jacquard Underneath Translucent TPU"
      ],
      [
        "Sole",
        "Deconstructed Patchwork Two-Tone White & Black Rubber Sole"
      ],
      [
        "Insignia",
        "Raised DIOR Signature Branding Inset at Outer Heel"
      ],
      [
        "Laces",
        "White Cotton Laces with Reinforced Aluminum Eyelets"
      ]
    ],
    "variants": [
      {
        "sku": "DIOR-B23-EU40",
        "name": "EU 40",
        "size": "EU 40",
        "price": 9800000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "DIOR-B23-EU41",
        "name": "EU 41",
        "size": "EU 41",
        "price": 9800000,
        "compareAt": null,
        "stock": 5,
        "max": 1
      },
      {
        "sku": "DIOR-B23-EU42",
        "name": "EU 42",
        "size": "EU 42",
        "price": 9800000,
        "compareAt": null,
        "stock": 6,
        "max": 1
      },
      {
        "sku": "DIOR-B23-EU43",
        "name": "EU 43",
        "size": "EU 43",
        "price": 9800000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      },
      {
        "sku": "DIOR-B23-EU44",
        "name": "EU 44",
        "size": "EU 44",
        "price": 9800000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "dior-saddle-bag-black-grained-calfskin",
    "name": "Dior Saddle Bag in Black Grained Calfskin",
    "brand": "Dior",
    "category": "fashion",
    "titleLine1": "DIOR SADDLE",
    "titleLine2": "“BLACK CALFSKIN”",
    "accent": "CD ALYX BUCKLE",
    "tagline": "John Galliano's 1999 Equestrian Masterpiece Modernized by Kim Jones",
    "badge": "FLAGSHIP",
    "description": "The immortal Saddle silhouette redefined. Constructed from luxurious black grained calfskin with magnetic flap closure concealing a zippered pocket, Christian Dior jacquard nylon strap, and the iconic industrial aluminum 'CD' roller-coaster buckle.",
    "care": "Protect with leather conditioner. Store in cotton dust bag.",
    "warranty": "Christian Dior Couture Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Hardware",
        "Industrial Anodized Aluminum 'CD' Signature Quick-Release Buckle"
      ],
      [
        "Leather",
        "Grained Black Matte Calfskin with Tonal Topstitching"
      ],
      [
        "Strap",
        "Adjustable 'CHRISTIAN DIOR' Jacquard Tech Webbing Strap"
      ],
      [
        "Dimensions",
        "26cm Width x 19cm Height x 4.5cm Depth"
      ]
    ],
    "variants": [
      {
        "sku": "DIOR-SADDLE-BLK",
        "name": "Black Grained Calfskin",
        "price": 31500000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "dior-oblique-jacquard-technical-cotton-overshirt",
    "name": "Dior Oblique Jacquard Technical Cotton Overshirt",
    "brand": "Dior",
    "category": "fashion",
    "titleLine1": "DIOR OBLIQUE",
    "titleLine2": "“OVERSHIRT”",
    "accent": "NAVY JACQUARD",
    "tagline": "All-Over Tonal Dior Oblique Motif in Structured Technical Cotton Twill",
    "badge": "TOP RATED",
    "description": "A perennial staple of the House of Dior. Crafted from a structured navy blue technical cotton jacquard woven with the historic Dior Oblique motif created in 1967. Designed with a boxy modern cut, snap-button front, and straight hem.",
    "care": "Dry clean only. Hang on tailored padded hanger.",
    "warranty": "Christian Dior Couture Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Weave",
        "All-Over Tonal Woven Dior Oblique Jacquard Twill"
      ],
      [
        "Composition",
        "70% Cotton, 30% Polyamide Structured Blend"
      ],
      [
        "Buttons",
        "Snap-Button Front Placket with Engraved 'DIOR' Logos"
      ],
      [
        "Fit",
        "Structured Modern Boxy Overshirt Silhouette"
      ]
    ],
    "variants": [
      {
        "sku": "DIOR-OBL-SHT-IT46",
        "name": "IT 46",
        "size": "IT 46",
        "price": 16500000,
        "compareAt": null,
        "stock": 2,
        "max": 2
      },
      {
        "sku": "DIOR-OBL-SHT-IT48",
        "name": "IT 48",
        "size": "IT 48",
        "price": 16500000,
        "compareAt": null,
        "stock": 4,
        "max": 2
      },
      {
        "sku": "DIOR-OBL-SHT-IT50",
        "name": "IT 50",
        "size": "IT 50",
        "price": 16500000,
        "compareAt": null,
        "stock": 5,
        "max": 2
      },
      {
        "sku": "DIOR-OBL-SHT-IT52",
        "name": "IT 52",
        "size": "IT 52",
        "price": 16500000,
        "compareAt": null,
        "stock": 2,
        "max": 2
      }
    ]
  },
  {
    "slug": "dior-christian-dior-atelier-relaxed-cotton-tshirt",
    "name": "Christian Dior Atelier Relaxed Cotton T-Shirt",
    "brand": "Dior",
    "category": "fashion",
    "titleLine1": "DIOR ATELIER",
    "titleLine2": "“PARIS T-SHIRT”",
    "accent": "RELAXED CUT",
    "tagline": "Homage to the Historic Couture Workshops of 3 Rue de Marignan, Paris",
    "badge": "EDITORIAL CHOICE",
    "description": "Paying tribute to the historic artisans of the House of Dior. Cut in a contemporary relaxed fit from thick, silky compact cotton jersey, featuring the 'Christian Dior Atelier 3 Rue de Marignan' signature printed on the chest and across the back.",
    "care": "Hand wash cold inside out. Iron on low heat without touching print.",
    "warranty": "Christian Dior Couture Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Fabric",
        "100% Compact Mercerized Long-Staple Cotton Jersey"
      ],
      [
        "Print",
        "White Flocked & Screenprinted 'Christian Dior Atelier'"
      ],
      [
        "Collar",
        "Ribbed Crew Neck with Trademark V-Stitching Inset"
      ],
      [
        "Origin",
        "Tailored in Italy"
      ]
    ],
    "variants": [
      {
        "sku": "DIOR-ATEL-S",
        "name": "S",
        "size": "S",
        "price": 5500000,
        "compareAt": 6200000,
        "stock": 4,
        "max": 2
      },
      {
        "sku": "DIOR-ATEL-M",
        "name": "M",
        "size": "M",
        "price": 5500000,
        "compareAt": 6200000,
        "stock": 8,
        "max": 2
      },
      {
        "sku": "DIOR-ATEL-L",
        "name": "L",
        "size": "L",
        "price": 5500000,
        "compareAt": 6200000,
        "stock": 8,
        "max": 2
      },
      {
        "sku": "DIOR-ATEL-XL",
        "name": "XL",
        "size": "XL",
        "price": 5500000,
        "compareAt": 6200000,
        "stock": 3,
        "max": 2
      }
    ]
  },
  {
    "slug": "dior-explorer-ankle-boot-smooth-calfskin",
    "name": "Dior Explorer Ankle Boot with Oblique Inset",
    "brand": "Dior",
    "category": "fashion",
    "titleLine1": "DIOR EXPLORER",
    "titleLine2": "“ANKLE BOOT”",
    "accent": "NOTCHED LUG SOLE",
    "tagline": "Refined Outdoor Hybrid in Polished Calfskin and Mirage Oblique Mesh",
    "badge": "NEW ARRIVAL",
    "description": "A winter weather armor piece infused with couture detailing. Crafted from smooth black calfskin with lateral panels of beige and black Dior Oblique jacquard, reinforced padded collar, deep-cleated notched rubber lug sole, and rear pull tab.",
    "care": "Condition calfskin regularly. Protect oblique mesh with water shield.",
    "warranty": "Christian Dior Couture Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Construction",
        "Welded & Side-Stitched Notched Cleated Rubber Lug Sole"
      ],
      [
        "Materials",
        "Smooth Black Calfskin & Beige/Black Dior Oblique Jacquard"
      ],
      [
        "Hardware",
        "Black Matte Finish Metal Eyelets and Speed Lacing Hooks"
      ],
      [
        "Ankle Support",
        "Padded Leather Ankle Guard with Debossed DIOR Logo"
      ]
    ],
    "variants": [
      {
        "sku": "DIOR-EXPL-EU40",
        "name": "EU 40",
        "size": "EU 40",
        "price": 12500000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "DIOR-EXPL-EU41",
        "name": "EU 41",
        "size": "EU 41",
        "price": 12500000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      },
      {
        "sku": "DIOR-EXPL-EU42",
        "name": "EU 42",
        "size": "EU 42",
        "price": 12500000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      },
      {
        "sku": "DIOR-EXPL-EU43",
        "name": "EU 43",
        "size": "EU 43",
        "price": 12500000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "dior-b27-low-top-sneaker-smooth-calfskin",
    "name": "Dior B27 Low-Top Sneaker in Smooth Calfskin",
    "brand": "Dior",
    "category": "fashion",
    "titleLine1": "DIOR B27",
    "titleLine2": "“LOW-TOP”",
    "accent": "OBLIQUE GALAXY",
    "tagline": "1980s Retro Tennis Silhouette with Perforated Oblique Galaxy Leather",
    "badge": "LIMITED EDITION",
    "description": "The refined court sneaker born in the Dior workshops. Designed with white and grey smooth calfskin, enhanced by lateral inserts of Dior Oblique Galaxy leather—perforated smooth calfskin illuminated by a reflective lining beneath—and two-tone rubber sole.",
    "care": "Wipe with damp cloth and leather conditioner.",
    "warranty": "Christian Dior Couture Certificate of Authenticity.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Leather Innovation",
        "Dior Oblique Galaxy Reflective Perforated Calfskin"
      ],
      [
        "Sole",
        "Two-Tone Injected Rubber Sole with Dior Oblique Signature"
      ],
      [
        "Hardware",
        "Eyelets Shaped like the Iconic 'CD' Logo Signature"
      ],
      [
        "Tongue",
        "Padded Tongue with 'CD Icon' Molded Badge"
      ]
    ],
    "variants": [
      {
        "sku": "DIOR-B27-EU40",
        "name": "EU 40",
        "size": "EU 40",
        "price": 10500000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      },
      {
        "sku": "DIOR-B27-EU41",
        "name": "EU 41",
        "size": "EU 41",
        "price": 10500000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      },
      {
        "sku": "DIOR-B27-EU42",
        "name": "EU 42",
        "size": "EU 42",
        "price": 10500000,
        "compareAt": null,
        "stock": 5,
        "max": 1
      },
      {
        "sku": "DIOR-B27-EU43",
        "name": "EU 43",
        "size": "EU 43",
        "price": 10500000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "apple-iphone-16-pro-max-1tb-desert-titanium",
    "name": "Apple iPhone 16 Pro Max 1TB Desert Titanium",
    "brand": "Apple",
    "category": "electronics-gadgets",
    "titleLine1": "IPHONE 16 PRO",
    "titleLine2": "“MAX 1TB”",
    "accent": "DESERT TITANIUM",
    "tagline": "Grade 5 Titanium with A18 Pro Silicon & Camera Control",
    "badge": "ICONIC GRAIL",
    "description": "The most powerful iPhone ever created. Forged from aerospace-grade 5 titanium with an exquisite microblasted finish in Desert Titanium. Houses the trailblazing 3-nanometer A18 Pro chip, 48MP Fusion camera system with 5x optical telephoto, and Camera Control sensor.",
    "care": "Clean with soft, lint-free cloth. Water resistant IP68 (6m up to 30 mins).",
    "warranty": "1-year Apple limited warranty + AppleCare eligible.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1511707171634-5f897ff02560?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Silicon",
        "A18 Pro Chip (6-Core CPU, 6-Core GPU, 16-Core Neural Engine)"
      ],
      [
        "Display",
        "6.9\" Super Retina XDR OLED with ProMotion 120Hz & Always-On"
      ],
      [
        "Camera",
        "48MP Fusion Main + 48MP Ultra-Wide + 12MP 5x Telephoto"
      ],
      [
        "Chassis",
        "Grade 5 Titanium with Ceramic Shield Front Glass"
      ]
    ],
    "variants": [
      {
        "sku": "APL-IP16PM-1TB-DES",
        "name": "1TB / Desert Titanium",
        "price": 19990000,
        "compareAt": null,
        "stock": 5,
        "max": 1
      },
      {
        "sku": "APL-IP16PM-512-DES",
        "name": "512GB / Desert Titanium",
        "price": 17490000,
        "compareAt": null,
        "stock": 8,
        "max": 1
      }
    ]
  },
  {
    "slug": "apple-macbook-pro-16-m4-max-space-black",
    "name": "Apple MacBook Pro 16” Liquid Retina XDR (M4 Max)",
    "brand": "Apple",
    "category": "electronics-gadgets",
    "titleLine1": "MACBOOK PRO 16",
    "titleLine2": "“M4 MAX”",
    "accent": "SPACE BLACK",
    "tagline": "Supercharged by M4 Max with 16-Core CPU, 40-Core GPU, and 48GB RAM",
    "badge": "FLAGSHIP",
    "description": "The apex computing powerhouse for professionals. Anodized in an anti-fingerprint Space Black finish, featuring a breathtaking 16.2-inch Liquid Retina XDR display with 1,600 nits peak HDR brightness, Thunderbolt 5 ports, and extraordinary 24-hour battery life.",
    "care": "Wipe Liquid Retina display with clean water-dampened cloth.",
    "warranty": "1-year Apple limited warranty + AppleCare eligible.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Processor",
        "Apple M4 Max (16-Core CPU with 12 Performance Cores)"
      ],
      [
        "Graphics",
        "40-Core GPU with Hardware-Accelerated Ray Tracing"
      ],
      [
        "Unified Memory",
        "48GB High-Speed Unified Memory (546GB/s Bandwidth)"
      ],
      [
        "Storage & Battery",
        "1TB Blazing PCIe SSD + Up to 24 Hours Battery Life"
      ]
    ],
    "variants": [
      {
        "sku": "APL-MBP16-M4M",
        "name": "48GB / 1TB SSD / Space Black",
        "price": 39990000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      }
    ]
  },
  {
    "slug": "apple-watch-ultra-2-black-titanium-49mm",
    "name": "Apple Watch Ultra 2 GPS + Cellular 49mm Black Titanium",
    "brand": "Apple",
    "category": "electronics-gadgets",
    "titleLine1": "WATCH ULTRA 2",
    "titleLine2": "“BLACK TITANIUM”",
    "accent": "49MM RUGGED",
    "tagline": "The Ultimate Sports & Expedition Watch with 3000-Nit Sapphire Display",
    "badge": "TOP RATED",
    "description": "Engineered for endurance athletes, ocean divers, and mountain explorers. Housed in a dark black titanium case with sapphire front crystal, 3,000-nit display visibility in blinding sun, dual-frequency precision GPS, Depth gauge, and 86dB Emergency Siren.",
    "care": "Rinse with tap water after saltwater sessions.",
    "warranty": "1-year Apple limited warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Enclosure",
        "49mm Corrosion-Resistant Black Satin Titanium Case"
      ],
      [
        "Display",
        "Flat Sapphire Crystal Face with 3,000-Nit Peak Brightness"
      ],
      [
        "Battery",
        "Up to 36 Hours Normal Use / 72 Hours in Low Power Mode"
      ],
      [
        "Dive Spec",
        "EN13319 Depth Gauge Certified to 40 Meters"
      ]
    ],
    "variants": [
      {
        "sku": "APL-WULT2-BLK",
        "name": "Black Titanium / Dark Trail Loop",
        "price": 8990000,
        "compareAt": null,
        "stock": 6,
        "max": 1
      }
    ]
  },
  {
    "slug": "apple-airpods-max-usb-c-space-black",
    "name": "Apple AirPods Max (USB-C) Space Black",
    "brand": "Apple",
    "category": "electronics-gadgets",
    "titleLine1": "AIRPODS MAX",
    "titleLine2": "“USB-C”",
    "accent": "COMPUTATIONAL AUDIO",
    "tagline": "High-Fidelity Acoustic Architecture with Lossless USB-C & Pro ANC",
    "badge": "EDITORIAL CHOICE",
    "description": "An incomparable over-ear listening experience. Anodized aluminum earcups suspended by a breathable knit-mesh canopy headband and memory foam magnetic cushions, powered by dual Apple H1 computational audio chips, Personalized Spatial Audio, and Pro-grade ANC.",
    "care": "Store in Smart Case to preserve ultra-low-power standby mode.",
    "warranty": "1-year Apple limited warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Drivers",
        "Apple-Designed 40mm Dynamic Driver with Dual Neodymium Ring"
      ],
      [
        "Noise Cancellation",
        "Pro-Grade Active Noise Cancellation & Transparency Mode"
      ],
      [
        "Spatial Sound",
        "Personalized Spatial Audio with Dynamic Head Tracking"
      ],
      [
        "Port & Charge",
        "USB-C Direct Lossless Audio & Fast Charging"
      ]
    ],
    "variants": [
      {
        "sku": "APL-APM-USBC-SB",
        "name": "Space Black / USB-C",
        "price": 5990000,
        "compareAt": null,
        "stock": 8,
        "max": 2
      }
    ]
  },
  {
    "slug": "apple-ipad-pro-13-m4-oled-512gb-space-black",
    "name": "Apple iPad Pro 13” Ultra Retina XDR OLED (M4)",
    "brand": "Apple",
    "category": "electronics-gadgets",
    "titleLine1": "IPAD PRO 13",
    "titleLine2": "“TANDEM OLED”",
    "accent": "M4 SILICON",
    "tagline": "Impossibly Thin 5.1mm Design with Tandem OLED Breakthrough Display",
    "badge": "NEW ARRIVAL",
    "description": "The thinnest Apple product ever made at just 5.1mm. Introducing Tandem OLED technology combining two OLED panels for revolutionary 1,000 nits full-screen XDR brightness, powered by the next-generation M4 chip with support for Apple Pencil Pro.",
    "care": "Protect with Smart Folio or Magic Keyboard. Clean glass with microfiber.",
    "warranty": "1-year Apple limited warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Display",
        "13\" Tandem OLED Ultra Retina XDR (1600 Nits Peak HDR)"
      ],
      [
        "Thickness",
        "Unprecedented 5.1mm Ultra-Thin Unibody Profile"
      ],
      [
        "Chip",
        "Apple M4 Silicon with Hardware-Accelerated Mesh Shading"
      ],
      [
        "Stylus Support",
        "Apple Pencil Pro with Haptic Feedback & Barrel Roll"
      ]
    ],
    "variants": [
      {
        "sku": "APL-IPAD13-M4-512",
        "name": "512GB / Space Black / Wi-Fi",
        "price": 14990000,
        "compareAt": 16990000,
        "stock": 5,
        "max": 1
      }
    ]
  },
  {
    "slug": "apple-studio-display-27-5k-retina-nano-texture",
    "name": "Apple Studio Display 27” 5K Retina Nano-Texture",
    "brand": "Apple",
    "category": "electronics-gadgets",
    "titleLine1": "STUDIO DISPLAY",
    "titleLine2": "“5K NANO-TEXTURE”",
    "accent": "27-INCH RETINA",
    "tagline": "5K Color-Accurate Master Monitor with 12MP Center Stage Camera",
    "badge": "LIMITED EDITION",
    "description": "A monumental window into creative work. Expansive 27-inch 5K Retina canvas etched with anti-reflective Nano-Texture glass at the nanometer level. Equipped with A13 Bionic chip powering Center Stage camera tracking, three-mic array, and six-speaker sound with Spatial Audio.",
    "care": "Clean exclusively with Apple's included dry polishing cloth.",
    "warranty": "1-year Apple limited warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Resolution",
        "27\" 5K Retina (5120x2880) at 218 PPI, 600 Nits, P3 Color"
      ],
      [
        "Glass Coating",
        "Anti-Reflective Nano-Texture Glass Etching"
      ],
      [
        "Audio System",
        "Six-Speaker Sound System with Force-Cancelling Woofers"
      ],
      [
        "Connectivity",
        "One Thunderbolt 3 Host Port (96W Charging) + 3 USB-C"
      ]
    ],
    "variants": [
      {
        "sku": "APL-SD-27-NANO",
        "name": "Nano-Texture / Tilt Stand",
        "price": 18990000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      }
    ]
  },
  {
    "slug": "sony-playstation-5-pro-console-2tb-storage",
    "name": "Sony PlayStation 5 Pro 2TB Console",
    "brand": "Sony",
    "category": "electronics-gadgets",
    "titleLine1": "PLAYSTATION 5",
    "titleLine2": "“PRO 2TB”",
    "accent": "PSSR AI UPSCALING",
    "tagline": "PlayStation Spectral Super Resolution with 67% More Compute Units",
    "badge": "ICONIC GRAIL",
    "description": "The absolute zenith of console gaming graphics. The PS5 Pro boasts an upgraded GPU with 67% more Compute Units, advanced ray tracing at double to triple speeds, PlayStation Spectral Super Resolution (PSSR) machine-learning upscaling, and 2TB high-speed SSD storage.",
    "care": "Keep ventilation fins unobstructed. Operate in horizontal or vertical stand.",
    "warranty": "1-year official Sony PlayStation India warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "GPU Upgrade",
        "Upgraded GPU with 67% More Compute Units & 28% Faster RAM"
      ],
      [
        "AI Upscaling",
        "PlayStation Spectral Super Resolution (PSSR) Machine Learning"
      ],
      [
        "Ray Tracing",
        "Advanced Ray Tracing Engine Delivering 2x-3x Ray Cast Speeds"
      ],
      [
        "Internal Storage",
        "2TB High-Speed Custom PCIe 4.0 NVMe SSD (5.5 GB/s)"
      ]
    ],
    "variants": [
      {
        "sku": "SNY-PS5-PRO-2TB",
        "name": "2TB Console / DualSense",
        "price": 7499000,
        "compareAt": null,
        "stock": 7,
        "max": 1
      }
    ]
  },
  {
    "slug": "sony-wh-1000xm5-wireless-noise-cancelling-headphones",
    "name": "Sony WH-1000XM5 Wireless ANC Headphones",
    "brand": "Sony",
    "category": "electronics-gadgets",
    "titleLine1": "SONY WH-1000XM5",
    "titleLine2": "“ANC FLAGSHIP”",
    "accent": "AUTO NC OPTIMIZER",
    "tagline": "Industry-Leading Dual-Processor Noise Cancellation with 8 Microphones",
    "badge": "TOP RATED",
    "description": "The undisputed king of travel acoustics. Two processors control eight precision microphones for unprecedented noise cancellation. Fitted with specially designed 30mm carbon fiber composite drivers, LDAC high-resolution wireless streaming, and 30-hour battery life.",
    "care": "Fold flat into included protective zippered magnetic travel case.",
    "warranty": "1-year official Sony India warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Processors",
        "Integrated Processor V1 + HD Noise Cancelling Processor QN1"
      ],
      [
        "Drivers",
        "30mm Specially Engineered Carbon Fiber Soft-Edge Dome"
      ],
      [
        "Battery Life",
        "30 Hours with ANC On (3-Minute Quick Charge = 3 Hours)"
      ],
      [
        "Codecs",
        "LDAC, AAC, SBC with DSEE Extreme AI Audio Upscaling"
      ]
    ],
    "variants": [
      {
        "sku": "SNY-XM5-BLK",
        "name": "Matte Black",
        "price": 2999000,
        "compareAt": 3499000,
        "stock": 12,
        "max": 2
      },
      {
        "sku": "SNY-XM5-SLV",
        "name": "Platinum Silver",
        "price": 2999000,
        "compareAt": 3499000,
        "stock": 8,
        "max": 2
      }
    ]
  },
  {
    "slug": "sony-alpha-a7r-v-61mp-full-frame-mirrorless-camera",
    "name": "Sony Alpha A7R V 61.0MP Full-Frame Mirrorless",
    "brand": "Sony",
    "category": "electronics-gadgets",
    "titleLine1": "ALPHA A7R V",
    "titleLine2": "“61.0MP AI”",
    "accent": "FULL-FRAME BIONZ XR",
    "tagline": "Dedicated AI Processing Unit for Deep Learning Subject Recognition",
    "badge": "FLAGSHIP",
    "description": "A triumph of photographic resolution and intelligence. Houses a 61.0MP back-illuminated Exmor R CMOS sensor paired with dual BIONZ XR engines and a dedicated AI coprocessor that recognizes humans, vehicles, birds, and insects in real-time, backed by 8-step stabilization.",
    "care": "Sensor cleaning mode before swapping lenses in dusty conditions.",
    "warranty": "2-year official Sony India camera warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Sensor",
        "61.0MP 35mm Full-Frame Back-Illuminated Exmor R CMOS"
      ],
      [
        "AI Processing",
        "Real-Time AI Subject Pose Recognition & Eye-Tracking"
      ],
      [
        "Image Stabilization",
        "8.0-Stop In-Body 5-Axis Optical Image Stabilization"
      ],
      [
        "Video",
        "8K 24p/25p and 4K 60p 10-Bit 4:2:2 All-Intra Recording"
      ]
    ],
    "variants": [
      {
        "sku": "SNY-ILCE-7RM5",
        "name": "Body Only",
        "price": 35399000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "sony-bravia-xr-65-a95l-qd-oled-4k-hdr-tv",
    "name": "Sony BRAVIA XR 65” A95L QD-OLED 4K TV",
    "brand": "Sony",
    "category": "electronics-gadgets",
    "titleLine1": "BRAVIA XR",
    "titleLine2": "“65” A95L”",
    "accent": "COGNITIVE QD-OLED",
    "tagline": "The Reference Television of Hollywood Colorists and Studio Directors",
    "badge": "EDITORIAL CHOICE",
    "description": "Sony's crowning television masterpiece. Combining quantum dot color purity with self-illuminating OLED contrast, driven by the Cognitive Processor XR. Features Acoustic Surface Audio+ where actuators vibrate the screen itself to generate dialogue directly from characters' lips.",
    "care": "Wall-mount using compatible VESA ultra-slim bracket.",
    "warranty": "3-year official Sony comprehensive panel warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Panel Tech",
        "65\" 4K QD-OLED (Quantum Dot + Organic Light Emitting Diode)"
      ],
      [
        "Processor",
        "Cognitive Processor XR Mimicking Human Brain Perception"
      ],
      [
        "Sound",
        "Acoustic Surface Audio+ with Dual Subwoofers Emitting from Glass"
      ],
      [
        "Gaming Features",
        "4K 120Hz, VRR, ALLM, Auto HDR Tone Mapping for PS5"
      ]
    ],
    "variants": [
      {
        "sku": "SNY-XR65A95L",
        "name": "65-Inch Master Series",
        "price": 32999000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "sony-wf-1000xm5-truly-wireless-noise-cancelling-earbuds",
    "name": "Sony WF-1000XM5 Truly Wireless ANC Earbuds",
    "brand": "Sony",
    "category": "electronics-gadgets",
    "titleLine1": "SONY WF-XM5",
    "titleLine2": "“DYNAMIC DRIVER X”",
    "accent": "ULTRA-COMPACT ANC",
    "tagline": "Audiophile Sound Purity and Bone Conduction Clear Calling Sensors",
    "badge": "NEW ARRIVAL",
    "description": "Astonishing noise cancellation squeezed into an ultra-ergonomic tiny chassis. Features Dynamic Driver X with multi-material dome, two proprietary noise-canceling processors, bone conduction speech pickup sensors, and noise-isolation memory foam ear tips.",
    "care": "Squeeze polyurethane tips gently before inserting for acoustic seal.",
    "warranty": "1-year official Sony India warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Driver",
        "Dynamic Driver X with Separation Dome & Soft Surround"
      ],
      [
        "Microphones",
        "3 Microphones per Earbud with Dual Feedback Tech"
      ],
      [
        "Voice Pickup",
        "Bone Conduction Sensors + AI Deep Neural Network Mesh"
      ],
      [
        "Water Resistance",
        "IPX4 Splash and Sweat Resistant Rating"
      ]
    ],
    "variants": [
      {
        "sku": "SNY-WFXM5-BLK",
        "name": "Black Wireless Earbuds",
        "price": 2199000,
        "compareAt": 2499000,
        "stock": 10,
        "max": 2
      }
    ]
  },
  {
    "slug": "sony-fe-24-70mm-f2-8-gm-ii-lens",
    "name": "Sony FE 24-70mm f/2.8 GM II G Master Lens",
    "brand": "Sony",
    "category": "electronics-gadgets",
    "titleLine1": "G MASTER",
    "titleLine2": "“24-70MM F/2.8 II”",
    "accent": "XA OPTICS",
    "tagline": "The World's Lightest and Most Compact Constant f/2.8 Standard Zoom",
    "badge": "LIMITED EDITION",
    "description": "The indispensable workhorse standard zoom redesigned from optical scratch. 22% lighter and 18% smaller than its predecessor, delivering corner-to-corner sharpness at f/2.8 with five aspherical elements, four XD Linear focus motors, and smooth manual aperture control.",
    "care": "Keep protective UV filter installed. Store in moisture-controlled dry cabinet.",
    "warranty": "2-year official Sony India lens warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1616469829941-c7200edec809?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1616469829941-c7200edec809?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Aperture",
        "Constant f/2.8 Bright Aperture with 11 Circular Blades"
      ],
      [
        "Motors",
        "Quad XD (Extreme Dynamic) Linear Motors for High-Speed AF"
      ],
      [
        "Weight",
        "Revolutionary 695g Featherweight Build (22% Reduction)"
      ],
      [
        "Elements",
        "Extreme Aspherical (XA), Super ED, and Nano AR Coating II"
      ]
    ],
    "variants": [
      {
        "sku": "SNY-SEL2470GM2",
        "name": "FE Mount f/2.8",
        "price": 19999000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      }
    ]
  },
  {
    "slug": "bose-quietcomfort-ultra-wireless-headphones-black",
    "name": "Bose QuietComfort Ultra Wireless Headphones",
    "brand": "Bose",
    "category": "electronics-gadgets",
    "titleLine1": "BOSE QC ULTRA",
    "titleLine2": "“IMMERSIVE AUDIO”",
    "accent": "CUSTOMTUNE TECH",
    "tagline": "World-Class Noise Cancellation with Revolutionary Spatial Immersion",
    "badge": "ICONIC GRAIL",
    "description": "Headphones that don't just cancel sound—they envelop you inside it. Bose Immersive Audio spatializes content so music feels placed in a room in front of you. CustomTune technology analyzes your unique ear canal shape to customize sound and noise cancellation precisely to you.",
    "care": "Wipe protein leather earcups with dry cloth. Store in contoured case.",
    "warranty": "1-year Bose official manufacturer warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Acoustics",
        "Proprietary CustomTune Ear-Canal Measuring Technology"
      ],
      [
        "Spatial Mode",
        "Bose Immersive Audio (Still and Motion Tracking Modes)"
      ],
      [
        "Microphones",
        "12 Microphones for Noise-Cancelling and Voice Clarity"
      ],
      [
        "Battery",
        "Up to 24 Hours (Up to 18 Hours with Immersive Audio Enabled)"
      ]
    ],
    "variants": [
      {
        "sku": "BOS-QCU-BLK",
        "name": "Triple Black",
        "price": 3590000,
        "compareAt": null,
        "stock": 9,
        "max": 2
      },
      {
        "sku": "BOS-QCU-WHT",
        "name": "White Smoke",
        "price": 3590000,
        "compareAt": null,
        "stock": 7,
        "max": 2
      }
    ]
  },
  {
    "slug": "bose-smart-ultra-soundbar-dolby-atmos",
    "name": "Bose Smart Ultra Soundbar with Dolby Atmos",
    "brand": "Bose",
    "category": "electronics-gadgets",
    "titleLine1": "BOSE SMART",
    "titleLine2": "“ULTRA SOUNDBAR”",
    "accent": "DOLBY ATMOS",
    "tagline": "A.I. Dialogue Mode and Upward-Firing Dipole Transducers for True Cinema",
    "badge": "FLAGSHIP",
    "description": "The ultimate cinematic centerpiece. True Dolby Atmos with proprietary TrueSpace spatial processing separating instruments, dialogue, and effects to project overhead and side sound. Built-in A.I. Dialogue Mode automatically balances vocal frequencies over thundering explosions.",
    "care": "Dust top polished glass surface with dry microfiber cloth.",
    "warranty": "1-year Bose official manufacturer warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Transducers",
        "Nine Precision Dipole Transducers (Including 2 Upward-Firing)"
      ],
      [
        "Audio Formats",
        "Dolby Atmos, Dolby Digital, TrueSpace 3D Audio"
      ],
      [
        "AI Processing",
        "A.I. Dialogue Mode for Crystal-Clear Vocal Clarity"
      ],
      [
        "Cabinet",
        "Premium Metal Grille with Polished Impact-Resistant Glass Top"
      ]
    ],
    "variants": [
      {
        "sku": "BOS-SMART-ULTRA-SND",
        "name": "Black / Glass Top",
        "price": 9990000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      }
    ]
  },
  {
    "slug": "bose-quietcomfort-ultra-earbuds-white-smoke",
    "name": "Bose QuietComfort Ultra Earbuds",
    "brand": "Bose",
    "category": "electronics-gadgets",
    "titleLine1": "QC ULTRA",
    "titleLine2": "“EARBUDS”",
    "accent": "SPATIAL AUDIO",
    "tagline": "The World's Best Earbud Active Noise Cancelling Sized for All-Day Pocket Comfort",
    "badge": "TOP RATED",
    "description": "The benchmark in wireless earbud noise cancellation. CustomTune automatically optimizes acoustic profile to the acoustic properties of each individual ear canal. Features spatialized Bose Immersive Audio, smooth touch gestures, and wireless charging case compatibility.",
    "care": "Clean acoustic mesh gently with dry cotton swab.",
    "warranty": "1-year Bose official manufacturer warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Fit Kit",
        "9 Combinations of Soft Silicone Ear Tips & Stability Bands"
      ],
      [
        "Acoustic Engine",
        "Bose CustomTune Auto-Calibration Every Time You Put Them On"
      ],
      [
        "Battery Life",
        "6 Hours per Charge + 18 Additional Hours in Charging Case"
      ],
      [
        "Water Rating",
        "IPX4 Sweat and Moisture Resistant Seal"
      ]
    ],
    "variants": [
      {
        "sku": "BOS-QCU-EAR-WS",
        "name": "White Smoke",
        "price": 2590000,
        "compareAt": 2990000,
        "stock": 8,
        "max": 2
      }
    ]
  },
  {
    "slug": "bose-bass-module-700-wireless-subwoofer",
    "name": "Bose Bass Module 700 Wireless Subwoofer",
    "brand": "Bose",
    "category": "electronics-gadgets",
    "titleLine1": "BASS MODULE",
    "titleLine2": "“700 SUBWOOFER”",
    "accent": "QUIETPORT TECH",
    "tagline": "Earth-Shaking Deep Resonant Bass with Premium Tempered Glass Top",
    "badge": "EDITORIAL CHOICE",
    "description": "Hear and feel the thunder. The Bass Module 700 pairs wirelessly with Bose soundbars to deliver visceral, subterranean bass without distortion. QuietPort technology utilizes a tuned port tube to eliminate turbulence, wrapped in a lustrous premium tempered glass top.",
    "care": "Do not place liquid drinks on tempered glass top.",
    "warranty": "1-year Bose official manufacturer warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Port System",
        "Patented QuietPort Resonant Chamber (Zero Air Turbulence)"
      ],
      [
        "Driver",
        "Custom High-Excursion Long-Throw Bass Transducer"
      ],
      [
        "Cabinet Finish",
        "Architectural Tempered Impact-Resistant Glass Surface"
      ],
      [
        "Wireless Range",
        "Clean 30-Foot Wireless Connection to Bose Soundbars"
      ]
    ],
    "variants": [
      {
        "sku": "BOS-BM700-BLK",
        "name": "Black Glass",
        "price": 7990000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      }
    ]
  },
  {
    "slug": "bose-soundlink-max-portable-bluetooth-speaker",
    "name": "Bose SoundLink Max Portable Bluetooth Speaker",
    "brand": "Bose",
    "category": "electronics-gadgets",
    "titleLine1": "SOUNDLINK MAX",
    "titleLine2": "“PORTABLE”",
    "accent": "STEREO ROPE HANDLE",
    "tagline": "High-Output Party Stereo with Deep Bass and 20-Hour Rugged Waterproof Build",
    "badge": "NEW ARRIVAL",
    "description": "Massive sound that travels anywhere. Equipped with Bose Articulated Stereo Array containing three transducers and dual passive radiators. Wrapped in silicone-coated steel that resists drops, rust, and water (IP67), with a removable climbing rope carrying handle.",
    "care": "Rinse with tap water after exposure to sandy beaches.",
    "warranty": "1-year Bose official manufacturer warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Acoustics",
        "Articulated Stereo Transducer Array + Dual Passive Radiators"
      ],
      [
        "Durability",
        "IP67 Dustproof, Shockproof & Floats in Water"
      ],
      [
        "Battery Runtime",
        "20 Hours Continuous Playback + Phone Power Bank Output"
      ],
      [
        "Portability",
        "Detachable Soft-Woven Climbing Rope Carry Handle"
      ]
    ],
    "variants": [
      {
        "sku": "BOS-SLMAX-BLK",
        "name": "Black / Blue Rope Handle",
        "price": 3990000,
        "compareAt": null,
        "stock": 6,
        "max": 2
      }
    ]
  },
  {
    "slug": "bose-s1-pro-plus-wireless-pa-system",
    "name": "Bose S1 Pro+ Multi-Position Wireless PA System",
    "brand": "Bose",
    "category": "electronics-gadgets",
    "titleLine1": "BOSE S1 PRO+",
    "titleLine2": "“WIRELESS PA”",
    "accent": "STAGE LIVE SOUND",
    "tagline": "The Go-Anywhere All-in-One Live Sound System for Musicians and Events",
    "badge": "LIMITED EDITION",
    "description": "The ultimate portable PA system for musicians, DJs, and connoisseurs of high-output live audio. Features integrated 3-channel mixer, OLED displays on each channel, wireless RF transmitters for guitars and microphones, ToneMatch presets, and Auto EQ orientation sensor.",
    "care": "Recharge lithium-ion battery every 3 months if stored.",
    "warranty": "2-year Bose professional warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Mixer",
        "3-Channel Mixer with Dedicated OLED Rotary Displays"
      ],
      [
        "Wireless Inputs",
        "Integrated RF Receivers for Wireless Instrument Transmitters"
      ],
      [
        "Auto EQ",
        "Multi-Position Auto EQ (Floor Tilt, Tabletop, Monitor, Speaker Stand)"
      ],
      [
        "Battery",
        "Rechargeable Lithium-Ion Battery Giving Up to 11 Hours Play"
      ]
    ],
    "variants": [
      {
        "sku": "BOS-S1PRO-PLUS",
        "name": "S1 Pro+ Wireless PA",
        "price": 6990000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      }
    ]
  },
  {
    "slug": "bang-olufsen-beosound-2-3rd-gen-wireless-speaker",
    "name": "Bang & Olufsen Beosound 2 (3rd Gen) Speaker",
    "brand": "Bang & Olufsen",
    "category": "electronics-gadgets",
    "titleLine1": "BEOSOUND 2",
    "titleLine2": "“3RD GEN”",
    "accent": "CONICAL ALUMINUM",
    "tagline": "360-Degree Acoustic Architecture Sculpted in Seamless Natural Aluminum",
    "badge": "HAUTE HORLOGERIE",
    "description": "An acoustic sculpture for modern interior architecture. Torqued from high-grade solid aluminum at B&O's legendary Factory 5 in Struer, Denmark. The conical profile projects spherical 360-degree acoustic performance with integrated proximity sensors and Mozart platform.",
    "care": "Wipe aluminum body with soft microfiber cloth. Avoid acidic cleaners.",
    "warranty": "3-year Bang & Olufsen international warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Craftsmanship",
        "Seamless Precision-Milled Aluminum Cone (Factory 5, Denmark)"
      ],
      [
        "Acoustic Lens",
        "Acoustic Lens Technology for Uniform 360-Degree Dispersion"
      ],
      [
        "Amplification",
        "1 x 15W Tweeter, 2 x 15W Midrange, 2 x 30W Woofer (Class D)"
      ],
      [
        "Intelligence",
        "Mozart Modular Streaming Platform with Active Room Compensation"
      ]
    ],
    "variants": [
      {
        "sku": "BO-BS2-ALU",
        "name": "Natural Polished Aluminum",
        "price": 26500000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      }
    ]
  },
  {
    "slug": "bang-olufsen-beoplay-h95-flagship-anc-headphones",
    "name": "Bang & Olufsen Beoplay H95 Flagship Headphones",
    "brand": "Bang & Olufsen",
    "category": "electronics-gadgets",
    "titleLine1": "BEOPLAY H95",
    "titleLine2": "“95TH ANNIVERSARY”",
    "accent": "LAMBSKIN & TITANIUM",
    "tagline": "The Pinnacle of Luxury Travel Listening with Precision Mechanical Dials",
    "badge": "FLAGSHIP",
    "description": "Crafted to celebrate 95 years of acoustic leadership. Custom titanium 40mm drivers tuned by B&O's acoustic tonmeisters, luxurious magnetic lambskin ear cushions, memory foam headband, rotary aluminum control dials inspired by luxury camera focus rings, and solid aluminum case.",
    "care": "Store in hard-shell solid aluminum presentation flight case.",
    "warranty": "3-year Bang & Olufsen international warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Drivers",
        "Custom 40mm Titanium Drivers with Neodymium Magnets"
      ],
      [
        "Controls",
        "Mechanical Rotary Knurled Aluminum Dials for Volume & ANC"
      ],
      [
        "Materials",
        "Soft Lambskin Leather, Cowhide Headband, Brushed Aluminum"
      ],
      [
        "Battery Life",
        "Sensational 38 Hours with Adaptive ANC Active"
      ]
    ],
    "variants": [
      {
        "sku": "BO-H95-GOLD",
        "name": "Gold Tone / Lambskin",
        "price": 9990000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      }
    ]
  },
  {
    "slug": "bang-olufsen-beosound-a9-5th-gen-wireless-home-speaker",
    "name": "Bang & Olufsen Beosound A9 (5th Gen) Home Speaker",
    "brand": "Bang & Olufsen",
    "category": "electronics-gadgets",
    "titleLine1": "BEOSOUND A9",
    "titleLine2": "“5TH GEN”",
    "accent": "KVADRAT WOOL",
    "tagline": "Iconic Circular Furniture Speaker with Solid Oak Legs and 1500W Power",
    "badge": "ICONIC GRAIL",
    "description": "A monumental piece of acoustic furniture designed by Øivind Alexander Slaatto. Designed to resemble a modernist minimalist canvas, resting on three solid turned oak legs. Delivering 1,500 watts of room-filling digital amplification and Kvadrat wool fabric cover.",
    "care": "Dust Kvadrat wool cover with soft vacuum brush attachment.",
    "warranty": "3-year Bang & Olufsen international warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Amplification",
        "7 Built-In Class D Amplifiers Totaling 1,500 Watts of Power"
      ],
      [
        "Materials",
        "Solid Turned Oak Wood Legs, Anodized Ring, Kvadrat Wool Cover"
      ],
      [
        "Room Calibration",
        "Active Room Compensation Analyzing Room Acoustics"
      ],
      [
        "Interface",
        "Capacitive Touch-Sensitive Rim for Volume & Track Swiping"
      ]
    ],
    "variants": [
      {
        "sku": "BO-A9-5G-OAK",
        "name": "Natural Oak / Silver Ring",
        "price": 39000000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      }
    ]
  },
  {
    "slug": "bang-olufsen-beosound-stage-dolby-atmos-soundbar",
    "name": "Bang & Olufsen Beosound Stage Dolby Atmos Soundbar",
    "brand": "Bang & Olufsen",
    "category": "electronics-gadgets",
    "titleLine1": "BEOSOUND STAGE",
    "titleLine2": "“DOLBY ATMOS”",
    "accent": "SMOKED OAK",
    "tagline": "Scandi Minimalist All-in-One Architectural Soundbar with 11 Drivers",
    "badge": "TOP RATED",
    "description": "Elevate movie watching with Danish architectural elegance. Beosound Stage is a standalone 3-channel soundbar with eleven custom speaker drivers and 550 watts of amplification that delivers heart-thumping Dolby Atmos immersion without requiring a separate subwoofer.",
    "care": "Wipe aluminum or wood frame with dry cloth.",
    "warranty": "3-year Bang & Olufsen international warranty.",
    "returnDays": 7,
    "hero": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Driver Array",
        "11 Custom Transducers (4 x 4\" Woofers, 4 x 1.5\" Mid, 3 x 3/4\" Tweeters)"
      ],
      [
        "Frame",
        "Seamless Extruded Aluminum with Integrated Engraved Control Buttons"
      ],
      [
        "Immersion",
        "3-Channel Stereo Sound System with Dolby Atmos & Dolby TrueHD"
      ],
      [
        "Connectivity",
        "HDMI eARC, Apple AirPlay 2, Chromecast Built-In, Bluetooth 4.2"
      ]
    ],
    "variants": [
      {
        "sku": "BO-STAGE-ALU",
        "name": "Natural Aluminum / Black",
        "price": 18500000,
        "compareAt": 21000000,
        "stock": 3,
        "max": 1
      }
    ]
  },
  {
    "slug": "bang-olufsen-beoplay-ex-waterproof-anc-earbuds",
    "name": "Bang & Olufsen Beoplay EX Waterproof ANC Earbuds",
    "brand": "Bang & Olufsen",
    "category": "electronics-gadgets",
    "titleLine1": "BEOPLAY EX",
    "titleLine2": "“WATERPROOF”",
    "accent": "MIRROR GLASS",
    "tagline": "Stunning Glass Touch Interface with 9.2mm Neodymium Drivers and IP57 Seal",
    "badge": "EDITORIAL CHOICE",
    "description": "B&O's most versatile, comfortable true wireless earphones ever. Stem-based ergonomic fit with high-precision mirror glass touch disc framed by brushed aluminum ring, large 9.2mm neodymium drivers, and IP57 waterproof rating up to 1 meter depth for 30 minutes.",
    "care": "Clean ear tips with warm water. Wipe glass disc with optic cloth.",
    "warranty": "2-year Bang & Olufsen international warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Touch Interface",
        "Mirror-Finished Glass Touch Interface with Aluminum Bezel"
      ],
      [
        "Driver Size",
        "Large 9.2mm Electro-Dynamic Neodymium Transducer"
      ],
      [
        "Waterproofing",
        "IP57 Waterproof Rating (Submersible up to 1 Meter)"
      ],
      [
        "Battery",
        "Up to 8 Hours Playback (28 Hours Total with Wireless Case)"
      ]
    ],
    "variants": [
      {
        "sku": "BO-EX-ANTH",
        "name": "Anthracite Oxygen",
        "price": 3990000,
        "compareAt": null,
        "stock": 5,
        "max": 2
      }
    ]
  },
  {
    "slug": "bang-olufsen-beosound-explore-rugged-speaker",
    "name": "Bang & Olufsen Beosound Explore Rugged Speaker",
    "brand": "Bang & Olufsen",
    "category": "electronics-gadgets",
    "titleLine1": "BEOSOUND",
    "titleLine2": "“EXPLORE”",
    "accent": "TYPE II ANODIZED",
    "tagline": "Ultra-Tough Type II Anodized Scratch-Proof Aluminum Outdoor Speaker",
    "badge": "NEW ARRIVAL",
    "description": "Engineered without compromise for outdoor adventure. Enclosed in a ribbed Type II anodized aluminum shell crafted in Denmark to resist scratches and drops. Features 360-degree True360 sound, carabiner clip for backpacks, and 27 hours of battery life.",
    "care": "Rinse mud and sand under running tap water.",
    "warranty": "2-year Bang & Olufsen international warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Armor",
        "Type II Anodized Scratch-Resistant Ribbed Aluminum Core"
      ],
      [
        "Water & Dust",
        "IP67 Fully Dustproof and Waterproof up to 1m Depth"
      ],
      [
        "Battery",
        "27-Hour High-Capacity Playtime at Normal Listening Levels"
      ],
      [
        "Hardware",
        "Integrated Heavy-Duty Aluminum Carabiner & Strap"
      ]
    ],
    "variants": [
      {
        "sku": "BO-EXPLORE-GRN",
        "name": "Army Green / Black Strap",
        "price": 1990000,
        "compareAt": null,
        "stock": 8,
        "max": 3
      }
    ]
  },
  {
    "slug": "tom-ford-tobacco-vanille-eau-de-parfum-100ml",
    "name": "Tom Ford Tobacco Vanille Eau de Parfum 100ml",
    "brand": "Tom Ford",
    "category": "beauty-care",
    "titleLine1": "PRIVATE BLEND",
    "titleLine2": "“TOBACCO VANILLE”",
    "accent": "100ML EDP",
    "tagline": "Opulent English Gentlemen's Club Aroma of Fine Tobacco and Creamy Tonka",
    "badge": "ICONIC GRAIL",
    "description": "Tom Ford's affection for London inspired this opulent oriental scent. Reinventing a classic fragrance genre by infusing creamy tonka bean, aromatic vanilla, cocoa, dry fruit accords, and sweet wood sap into an intoxicating, modern private blend.",
    "care": "Store in a cool, dark place away from direct sunlight to preserve oils.",
    "warranty": "Guaranteed 100% authentic Tom Ford Beauty flacon.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Fragrance Family",
        "Warm & Spicy Oriental Gourmand"
      ],
      [
        "Key Notes",
        "Tobacco Leaf, Ginger, Cocoa, Tonka Bean, Vanilla, Dry Fruit"
      ],
      [
        "Flacon Design",
        "Architectural Chess-Piece Silhouette with Gold Inset Plaque"
      ],
      [
        "Concentration",
        "Eau de Parfum High-Longevity Formulation (100ml)"
      ]
    ],
    "variants": [
      {
        "sku": "TF-TV-100ML",
        "name": "100ml Flacon",
        "price": 3450000,
        "compareAt": null,
        "stock": 6,
        "max": 2
      },
      {
        "sku": "TF-TV-50ML",
        "name": "50ml Flacon",
        "price": 2350000,
        "compareAt": null,
        "stock": 9,
        "max": 2
      }
    ]
  },
  {
    "slug": "tom-ford-oud-wood-eau-de-parfum-100ml",
    "name": "Tom Ford Oud Wood Eau de Parfum 100ml",
    "brand": "Tom Ford",
    "category": "beauty-care",
    "titleLine1": "PRIVATE BLEND",
    "titleLine2": "“OUD WOOD”",
    "accent": "SMOKY RESINS",
    "tagline": "Rare Exotic Rosewood, Cardamom, and Smoky Amber Incense",
    "badge": "TOP RATED",
    "description": "One of the most rare, precious, and expensive ingredients in a perfumer's arsenal. Exotic rosewood and cardamom give way to a smoky blend of rare oud wood, sandalwood, and vetiver. Tonka bean and amber add warmth and sensuality.",
    "care": "Keep bottle upright. Avoid shaking.",
    "warranty": "Guaranteed 100% authentic Tom Ford Beauty flacon.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Fragrance Family",
        "Classic Woods & Exotic Resins"
      ],
      [
        "Key Notes",
        "Rare Oud Wood, Sandalwood, Chinese Pepper, Rosewood, Amber"
      ],
      [
        "Character",
        "Smoky, Mysterious, Earthy, and Intensely Sophisticated"
      ],
      [
        "Flacon",
        "Dark Smoked Architectural Glass with Carved Cap"
      ]
    ],
    "variants": [
      {
        "sku": "TF-OW-100ML",
        "name": "100ml Flacon",
        "price": 3450000,
        "compareAt": null,
        "stock": 5,
        "max": 2
      }
    ]
  },
  {
    "slug": "tom-ford-lost-cherry-private-blend-50ml",
    "name": "Tom Ford Lost Cherry Private Blend 50ml",
    "brand": "Tom Ford",
    "category": "beauty-care",
    "titleLine1": "LOST CHERRY",
    "titleLine2": "“PRIVATE BLEND”",
    "accent": "LUSCIOUS NECTAR",
    "tagline": "A Full-Bodied Journey into the Forbidden with Black Cherry and Liqueur",
    "badge": "FLAGSHIP",
    "description": "A full-bodied journey into the once-forbidden. Contrasting sweet black cherry with luscious fruit flesh dripping in cherry liqueur, touched with a teasing touch of bitter almond, Turkish rose, and jasmine sambac.",
    "care": "Keep cap securely sealed between applications.",
    "warranty": "Guaranteed 100% authentic Tom Ford Beauty flacon.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Fragrance Family",
        "Luscious Warm Oriental Fruity Gourmand"
      ],
      [
        "Key Notes",
        "Black Cherry Accord, Bitter Almond, Griotte Syrup, Peru Balsam"
      ],
      [
        "Bottle Aesthetic",
        "Translucent Cherry-Red Inner Glass Layer with Pink Label"
      ],
      [
        "Volume",
        "50ml Spray Flacon"
      ]
    ],
    "variants": [
      {
        "sku": "TF-LC-50ML",
        "name": "50ml Flacon",
        "price": 3100000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      }
    ]
  },
  {
    "slug": "tom-ford-ft5876-square-acetate-optical-frames",
    "name": "Tom Ford FT5876 Square Acetate Eyewear",
    "brand": "Tom Ford",
    "category": "fashion",
    "titleLine1": "TOM FORD",
    "titleLine2": "“FT5876 EYEWEAR”",
    "accent": "T-LOGO TEMPLES",
    "tagline": "Handcrafted Italian Acetate Frames with Iconic Gold T-Temple Inlays",
    "badge": "EDITORIAL CHOICE",
    "description": "The definitive hallmark of intellectual sophistication. Hand-polished chunky black Italian acetate sculpted in a commanding square silhouette, accented with Tom Ford's signature gold metal 'T' hinge temples and blue-light block optical demo lenses.",
    "care": "Clean with included microfiber cloth and lens solution.",
    "warranty": "2-year Tom Ford Eyewear international warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Material",
        "100% High-Grade Italian Mazzucchelli Block Acetate"
      ],
      [
        "Insignia",
        "Gold Metal 'T' Temple Inlay Flowing Across Hinges"
      ],
      [
        "Lenses",
        "Factory-Fitted Blue Block Anti-Reflective Optical Lenses"
      ],
      [
        "Case",
        "Brown Velvet Hard Protective Case with Gold Logo Stamping"
      ]
    ],
    "variants": [
      {
        "sku": "TF-FT5876-BLK",
        "name": "Shiny Black Acetate",
        "price": 3200000,
        "compareAt": 3600000,
        "stock": 7,
        "max": 2
      }
    ]
  },
  {
    "slug": "tom-ford-silk-and-cashmere-crewneck-sweater",
    "name": "Tom Ford Silk & Cashmere Fine-Gauge Crewneck",
    "brand": "Tom Ford",
    "category": "fashion",
    "titleLine1": "TOM FORD",
    "titleLine2": "“SILK & CASHMERE”",
    "accent": "FINE GAUGE",
    "tagline": "Featherweight 70% Mulberry Silk and 30% Mongolian Cashmere Knit",
    "badge": "NEW ARRIVAL",
    "description": "The pinnacle of tactile under-jacket luxury. Knitted in Italy from an ultra-fine 18-gauge blend of 70% mulberry silk and 30% grade-A Mongolian cashmere, providing exceptional softness, subtle natural luster, and a streamlined athletic drape.",
    "care": "Dry clean only or gentle hand wash in lukewarm water with cashmere shampoo.",
    "warranty": "Tom Ford authenticity certificate.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Yarn",
        "70% Mulberry Silk, 30% Grade-A Mongolian Cashmere"
      ],
      [
        "Gauge",
        "Super-Fine 18-Gauge Fully Fashioned Italian Knit"
      ],
      [
        "Finishing",
        "Ribbed Neckline, Cuffs and Hem with Tubular Trim"
      ],
      [
        "Origin",
        "Made in Italy"
      ]
    ],
    "variants": [
      {
        "sku": "TF-KNIT-IT48",
        "name": "IT 48",
        "size": "IT 48",
        "price": 9500000,
        "compareAt": null,
        "stock": 2,
        "max": 1
      },
      {
        "sku": "TF-KNIT-IT50",
        "name": "IT 50",
        "size": "IT 50",
        "price": 9500000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      },
      {
        "sku": "TF-KNIT-IT52",
        "name": "IT 52",
        "size": "IT 52",
        "price": 9500000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      },
      {
        "sku": "TF-KNIT-IT54",
        "name": "IT 54",
        "size": "IT 54",
        "price": 9500000,
        "compareAt": null,
        "stock": 1,
        "max": 1
      }
    ]
  },
  {
    "slug": "tom-ford-grained-t-line-bifold-leather-wallet",
    "name": "Tom Ford Grained T-Line Bifold Leather Wallet",
    "brand": "Tom Ford",
    "category": "fashion",
    "titleLine1": "T-LINE",
    "titleLine2": "“BIFOLD WALLET”",
    "accent": "GRAINED CALF",
    "tagline": "Geometric T-Cut Card Slots with Gold Embossed Tom Ford Wordmark",
    "badge": "LIMITED EDITION",
    "description": "Sharp architectural leatherwork. Crafted in Italy from rich grained calfskin leather, distinguished by Tom Ford's signature 'T' geometric cut card slots, leather-lined cash pocket, and subtle gold foil logo stamped on the front corner.",
    "care": "Condition with high-grade leather wax. Avoid overstuffing slots.",
    "warranty": "Tom Ford authenticity certificate.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Leather",
        "Full-Grain Scratch-Resistant Italian Calfskin"
      ],
      [
        "Slots",
        "8 T-Line Cut Card Slots + 2 Receipt Pockets + 1 Currency Billfold"
      ],
      [
        "Branding",
        "Hot-Stamped Gold Foil 'TOM FORD' Signature"
      ],
      [
        "Dimensions",
        "11cm x 9cm Slim Profile"
      ]
    ],
    "variants": [
      {
        "sku": "TF-WLT-TLINE",
        "name": "Black Grained Leather",
        "price": 4800000,
        "compareAt": null,
        "stock": 5,
        "max": 2
      }
    ]
  },
  {
    "slug": "creed-aventus-eau-de-parfum-100ml",
    "name": "House of Creed Aventus Eau de Parfum 100ml",
    "brand": "Creed",
    "category": "beauty-care",
    "titleLine1": "HOUSE OF CREED",
    "titleLine2": "“AVENTUS”",
    "accent": "MILLÉSIME 100ML",
    "tagline": "Celebrating Strength, Power, and Success with Smoky Birch & Blackcurrant",
    "badge": "ICONIC GRAIL",
    "description": "The most legendary niche fragrance in history. Inspired by the dramatic life of a historic emperor waging war and peace. Sensual, audacious, and contemporary, opening with tart blackcurrant and bergamot, leading to birch smoke, Moroccan jasmine, and oakmoss.",
    "care": "Keep away from heat sources. Millésime oil infusion improves with age.",
    "warranty": "Guaranteed 100% authentic House of Creed France flacon.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Heritage",
        "Royal Creed Millésime Formulation Since 1760"
      ],
      [
        "Top Notes",
        "Lemon, Pink Pepper, Apple, Bergamot, Blackcurrant"
      ],
      [
        "Heart Notes",
        "Pineapple, Birch Smoke, Patchouli, Moroccan Jasmine"
      ],
      [
        "Base Notes",
        "Birch, Ambergris, Cedarwood, Oakmoss, Musk"
      ]
    ],
    "variants": [
      {
        "sku": "CRD-AVENTUS-100",
        "name": "100ml Flacon",
        "price": 3400000,
        "compareAt": null,
        "stock": 8,
        "max": 2
      }
    ]
  },
  {
    "slug": "creed-green-irish-tweed-eau-de-parfum-100ml",
    "name": "House of Creed Green Irish Tweed 100ml",
    "brand": "Creed",
    "category": "beauty-care",
    "titleLine1": "GREEN IRISH",
    "titleLine2": "“TWEED”",
    "accent": "VERDANT COUNTRY",
    "tagline": "A Fresh Walk Through the Emerald Isle Countryside with Lemon Verbena",
    "badge": "HERITAGE",
    "description": "A favorite of Hollywood leading men and royalty alike. Green Irish Tweed is the essence of gentlemanly sophistication, evoking the brisk country air of the Irish coast with fresh cut grass, wild peppermint, violet leaves, Florentine iris, and sandalwood.",
    "care": "Store in cool environment in original black matte flacon.",
    "warranty": "Guaranteed 100% authentic House of Creed France flacon.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Character",
        "Classic Aromatic Green Fougère"
      ],
      [
        "Top Notes",
        "Lemon Verbena, Peppermint, Bergamot"
      ],
      [
        "Heart Notes",
        "Fresh Violet Leaves, Florentine Iris"
      ],
      [
        "Base Notes",
        "Sandalwood, Oakmoss, Ambergris"
      ]
    ],
    "variants": [
      {
        "sku": "CRD-GIT-100",
        "name": "100ml Flacon",
        "price": 2950000,
        "compareAt": null,
        "stock": 6,
        "max": 2
      }
    ]
  },
  {
    "slug": "creed-silver-mountain-water-eau-de-parfum-100ml",
    "name": "House of Creed Silver Mountain Water 100ml",
    "brand": "Creed",
    "category": "beauty-care",
    "titleLine1": "SILVER MOUNTAIN",
    "titleLine2": "“WATER”",
    "accent": "SWISS ALPS FRESH",
    "tagline": "Crisp Pure Swiss Alpine Air with Green Tea and Blackcurrant",
    "badge": "TOP RATED",
    "description": "Inspired by Olivier Creed's fondness for skiing in the majestic Swiss Alps. Designed to capture the exhilarating purity of bubbling alpine streams, combining crisp green tea, blackcurrant, galbanum, bergamot, and sandalwood in an opaque white bottle resembling snow-capped summits.",
    "care": "Store in original box to shield from ultraviolet light.",
    "warranty": "Guaranteed 100% authentic House of Creed France flacon.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Bottle Design",
        "White High-Gloss Lacquered Glass with Silver Crest Cap"
      ],
      [
        "Top Notes",
        "Bergamot, Mandarin Orange, Neroli"
      ],
      [
        "Heart Notes",
        "Green Tea, Ozonated Water Accord, Blackcurrant Bud"
      ],
      [
        "Base Notes",
        "Sandalwood, Musk, Petitgrain, Galbanum"
      ]
    ],
    "variants": [
      {
        "sku": "CRD-SMW-100",
        "name": "100ml Flacon",
        "price": 2950000,
        "compareAt": null,
        "stock": 7,
        "max": 2
      }
    ]
  },
  {
    "slug": "creed-millesime-imperial-eau-de-parfum-100ml",
    "name": "House of Creed Millésime Impérial 100ml",
    "brand": "Creed",
    "category": "beauty-care",
    "titleLine1": "MILLÉSIME",
    "titleLine2": "“IMPÉRIAL”",
    "accent": "GOLD FLACON",
    "tagline": "Created for Royal Palaces with Marine Sea Salt and Sicilian Citrus",
    "badge": "EDITORIAL CHOICE",
    "description": "Fit for royalty and celebrated for its golden radiance. Millésime Impérial transports the senses to the sun-drenched orchards and seaside villas of Sicily with sparkling bergamot, marine sea salt accords, Florentine iris, and rich amber woods in an all-gold bottle.",
    "care": "Wipe gold mirror bottle with jewelry cloth.",
    "warranty": "Guaranteed 100% authentic House of Creed France flacon.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1563178406-4cdc2923acbc?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1563178406-4cdc2923acbc?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Flacon Finish",
        "All-Over Mirror Gold Chrome Metallic Coating"
      ],
      [
        "Top Notes",
        "Sea Salt Accord, Crisp Citrus, Sicilian Lemon"
      ],
      [
        "Heart Notes",
        "Florentine Iris, Mandarin, Bergamot"
      ],
      [
        "Base Notes",
        "Musk, Woody Notes, Marine Ambergris Accord"
      ]
    ],
    "variants": [
      {
        "sku": "CRD-IMP-100",
        "name": "100ml Gold Flacon",
        "price": 2950000,
        "compareAt": 3300000,
        "stock": 5,
        "max": 2
      }
    ]
  },
  {
    "slug": "creed-viking-cologne-eau-de-parfum-100ml",
    "name": "House of Creed Viking Cologne 100ml",
    "brand": "Creed",
    "category": "beauty-care",
    "titleLine1": "VIKING",
    "titleLine2": "“COLOGNE”",
    "accent": "AROMATIC FIRE",
    "tagline": "An Exhilarating Exploration of Nordic Fjords with Pink Peppercorn",
    "badge": "NEW ARRIVAL",
    "description": "An intoxicating awakening of fierce natural energy. Reinterprets the fiery spirit of Viking with the crisp freshness of a cologne. Opening with zesty mandarin and pink peppercorn, grounded by frankincense, lavender, rosemary, and earthy vetiver.",
    "care": "Keep away from heat sources.",
    "warranty": "Guaranteed 100% authentic House of Creed France flacon.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Character",
        "Fresh Aromatic Fougère with Nordic Spices"
      ],
      [
        "Top Notes",
        "Mandarin Orange, Lemon, Pink Peppercorn, Bergamot"
      ],
      [
        "Heart Notes",
        "Lavender, Geranium, Nutmeg, Rosemary, Sage"
      ],
      [
        "Base Notes",
        "Sandalwood, Frankincense, Patchouli, Cedarwood, Vetiver"
      ]
    ],
    "variants": [
      {
        "sku": "CRD-VIK-COL-100",
        "name": "100ml Flacon",
        "price": 2950000,
        "compareAt": null,
        "stock": 4,
        "max": 2
      }
    ]
  },
  {
    "slug": "creed-carmina-eau-de-parfum-75ml",
    "name": "House of Creed Carmina Eau de Parfum 75ml",
    "brand": "Creed",
    "category": "beauty-care",
    "titleLine1": "HOUSE OF CREED",
    "titleLine2": "“CARMINA”",
    "accent": "ROSE DE MAI",
    "tagline": "Electrifying Floral Amber with Plump Black Cherry and Saffron Warmth",
    "badge": "LIMITED EDITION",
    "description": "Inspired by the bold, visionary spirit of women throughout history. Carmina marries luscious black cherry and piquant pink pepper with prized Rose de Mai and violet, warming to a magnetic base of cashmere wood, amber, and frankincense in an electric magenta flacon.",
    "care": "Store bottle safely upright in its presentation case.",
    "warranty": "Guaranteed 100% authentic House of Creed France flacon.",
    "returnDays": 0,
    "hero": "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Colorway",
        "Striking Electric Magenta Glass with Faceted Crest Cap"
      ],
      [
        "Top Notes",
        "Black Cherry, Saffron, Pink Pepper"
      ],
      [
        "Heart Notes",
        "Rose de Mai, Violet, Cashmere Wood, Peony"
      ],
      [
        "Base Notes",
        "Frankincense, Myrrh, Amber, Musk"
      ]
    ],
    "variants": [
      {
        "sku": "CRD-CARM-75",
        "name": "75ml Magenta Flacon",
        "price": 3200000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      }
    ]
  },
  {
    "slug": "dyson-v15-detect-extra-cordless-vacuum-cleaner",
    "name": "Dyson V15 Detect Extra Cordless Vacuum",
    "brand": "Dyson",
    "category": "home-living",
    "titleLine1": "DYSON V15",
    "titleLine2": "“DETECT EXTRA”",
    "accent": "LASER ILLUMINATION",
    "tagline": "Laser Illumination Reveals Invisible Microscopic Dust on Hard Floors",
    "badge": "ICONIC GRAIL",
    "description": "Dyson's most powerful, intelligent cordless vacuum. Features a precisely-angled green optical light on the Fluffy cleaner head that reveals twice as much invisible microscopic dust on hard floors, an acoustic piezo sensor that sizes and counts dust particles, and 230AW suction.",
    "care": "Wash lifetime filter once a month in cold tap water. Air dry for 24 hours.",
    "warranty": "2-year Dyson India official comprehensive warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Motor",
        "Dyson Hyperdymium Motor (125,000 RPM, 230 Air Watts Suction)"
      ],
      [
        "Laser Optics",
        "Precisely Angled Green Optical Light Revealing Invisible Dust"
      ],
      [
        "Particle Sensor",
        "Piezo Sensor Counts & Measures Dust Particles 15,000x per sec"
      ],
      [
        "Runtime",
        "Up to 60 Minutes Fade-Free Power with Click-In Battery"
      ]
    ],
    "variants": [
      {
        "sku": "DYS-V15-EXT",
        "name": "Prussian Blue / Copper",
        "price": 6590000,
        "compareAt": null,
        "stock": 8,
        "max": 2
      }
    ]
  },
  {
    "slug": "dyson-purifier-cool-gen1-hepa-air-purifier",
    "name": "Dyson Purifier Cool Gen1 HEPA Air Purifier",
    "brand": "Dyson",
    "category": "home-living",
    "titleLine1": "DYSON PURIFIER",
    "titleLine2": "“COOL GEN1”",
    "accent": "HEPA H13 SEALED",
    "tagline": "Fully Sealed to HEPA H13 Standard Capturing 99.95% of Ultrafine Particles",
    "badge": "TOP RATED",
    "description": "Breathe purified air throughout your entire room. The whole purifier is fully sealed to HEPA H13 standard, preventing pollutants from leaking back into the air. Automatically senses and captures pollutants, projecting over 290 liters of smooth purified airflow per second.",
    "care": "Replace 360° combi filter annually or when notified on LCD screen.",
    "warranty": "2-year Dyson India official warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Filtration",
        "Fully Sealed HEPA H13 Capturing 99.95% of Particles to 0.1 Microns"
      ],
      [
        "Airflow Projection",
        "Air Multiplier Technology Delivering 290 L/s Airflow"
      ],
      [
        "Oscillation",
        "Smooth Adjustable 350-Degree Ambient Oscillation"
      ],
      [
        "Acoustics",
        "Acoustically Engineered for Quiet Night Mode (Sub-42dB)"
      ]
    ],
    "variants": [
      {
        "sku": "DYS-PUR-GEN1-WH",
        "name": "White / Silver",
        "price": 3990000,
        "compareAt": 4390000,
        "stock": 9,
        "max": 2
      }
    ]
  },
  {
    "slug": "dyson-airwrap-multi-styler-complete-long-copper",
    "name": "Dyson Airwrap Multi-Styler Complete Long",
    "brand": "Dyson",
    "category": "beauty-care",
    "titleLine1": "DYSON AIRWRAP",
    "titleLine2": "“COMPLETE LONG”",
    "accent": "COANDA EFFECT",
    "tagline": "Style with Air, Not Extreme Heat, Harnessing the Aerodynamic Coanda Effect",
    "badge": "FLAGSHIP",
    "description": "The most awarded hair styling sensation in the world. Engineered for multiple hair types and chest-length or longer hair. Utilizes the aerodynamic Coanda effect to attract and wrap hair around the barrel, drying and styling simultaneously without extreme heat damage.",
    "care": "Clean magnetic filter cage under running water every month.",
    "warranty": "2-year Dyson India official warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Aerodynamics",
        "Enhanced Coanda Airflow for Clockwise and Counter-Clockwise Curls"
      ],
      [
        "Heat Regulation",
        "Intelligent Heat Control Measuring Temp Over 40 Times per Second"
      ],
      [
        "Motor",
        "Dyson Digital Motor V9 (110,000 RPM Creating 3.2kPa Pressure)"
      ],
      [
        "Case",
        "Prussian Blue Cushioned Storage Case with Removable Lid"
      ]
    ],
    "variants": [
      {
        "sku": "DYS-AW-LONG-CP",
        "name": "Nickel / Copper (Long Barrels)",
        "price": 4990000,
        "compareAt": null,
        "stock": 7,
        "max": 1
      }
    ]
  },
  {
    "slug": "dyson-supersonic-nural-intelligent-hair-dryer",
    "name": "Dyson Supersonic Nural Intelligent Hair Dryer",
    "brand": "Dyson",
    "category": "beauty-care",
    "titleLine1": "SUPERSONIC",
    "titleLine2": "“NURAL”",
    "accent": "SCALP PROTECT",
    "tagline": "Network of Nural Sensors Automatically Reduces Heat as It Nears Your Scalp",
    "badge": "NEW ARRIVAL",
    "description": "Dyson's most intelligent hair dryer ever. A network of Nural sensors automatically reduces heat to 55°C as it nears your head to protect scalp health and enhance natural hair shine, featuring capsule illumination that changes color with temperature.",
    "care": "Wash filter under warm tap water when filter LED flashes amber.",
    "warranty": "2-year Dyson India official warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Sensor Tech",
        "Time-of-Flight Infrared Beam Measuring Distance to Scalp"
      ],
      [
        "Capsule Lighting",
        "Clear Endcap Changes Color from Blue to Red Indicating Temp"
      ],
      [
        "Attachment Memory",
        "Hall Sensor Remembers Custom Styling Preferences for Each Tool"
      ],
      [
        "Pause Detect",
        "Motion-Sensing Accelerometer Automatically Deactivates Air When Set Down"
      ]
    ],
    "variants": [
      {
        "sku": "DYS-NURAL-STR",
        "name": "Strawberry Bronze / Blush Pink",
        "price": 4190000,
        "compareAt": null,
        "stock": 6,
        "max": 2
      }
    ]
  },
  {
    "slug": "dyson-zone-absolute-plus-noise-cancelling-headphones",
    "name": "Dyson Zone Absolute+ ANC Headphones with Air Purifier",
    "brand": "Dyson",
    "category": "electronics-gadgets",
    "titleLine1": "DYSON ZONE",
    "titleLine2": "“ABSOLUTE+”",
    "accent": "DUAL FILTRATION",
    "tagline": "Pure Audio Meets Pure Air with Active Noise Cancelling and Contactless Visor",
    "badge": "LIMITED EDITION",
    "description": "An unprecedented innovation merging pure high-fidelity audio with personal air purification. Advanced active noise cancellation reduces background city rumble by up to 38dB, while miniaturized compressors in each earcup draw in air through dual-layer electrostatic filters.",
    "care": "Wipe detachable travel visor with clean damp cloth.",
    "warranty": "2-year Dyson India official warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Noise Cancellation",
        "Advanced ANC with 8 Microphones Monitoring Noise 384,000x / sec"
      ],
      [
        "Air Purification",
        "Dual-Layer Electrostatic Filters Capturing 99% of Ultrafine Particles"
      ],
      [
        "Drivers",
        "40mm 16-Ohm Neodymium Transducers Reproducing 6Hz to 21kHz"
      ],
      [
        "Contactless Visor",
        "Attaches Magnetically to Channel Purified Airflow to Nose & Mouth"
      ]
    ],
    "variants": [
      {
        "sku": "DYS-ZONE-ABS-PLUS",
        "name": "Prussian Blue / Bright Copper",
        "price": 6490000,
        "compareAt": 7490000,
        "stock": 3,
        "max": 1
      }
    ]
  },
  {
    "slug": "dyson-solarcycle-morph-intelligent-desk-light",
    "name": "Dyson Solarcycle Morph Intelligent Desk Light",
    "brand": "Dyson",
    "category": "home-living",
    "titleLine1": "SOLARCYCLE",
    "titleLine2": "“MORPH LIGHT”",
    "accent": "LOCAL DAYLIGHT TRACKING",
    "tagline": "Intelligently Tracks Local Daylight to Provide the Right Light for Your Age",
    "badge": "EDITORIAL CHOICE",
    "description": "Driven by an algorithm that tracks the color temperature and brightness of daylight anywhere on Earth. Transforms 4 ways: task light, indirect ambient light, feature spotlight, or relaxing ambient light through an aluminum perforated stem.",
    "care": "Dust arm with dry cloth. LED lifespan rated for 60 years via Heat Pipe cooling.",
    "warranty": "5-year Dyson India official lighting warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Cooling Technology",
        "Heat Pipe Technology Keeps LEDs Cool to Maintain Quality for 60 Years"
      ],
      [
        "Daylight Algorithm",
        "GPS-Based Real-Time Tracking of Local Color Temperature & Lux"
      ],
      [
        "Versatility",
        "4-in-1 360-Degree Optical Head Rotation (Task, Ambient, Feature, Glow)"
      ],
      [
        "Touch Control",
        "Slide-Touch Dimming and Color Temperature Tuning (2700K - 6500K)"
      ]
    ],
    "variants": [
      {
        "sku": "DYS-MORPH-DESK-BLK",
        "name": "Matte Black",
        "price": 4590000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      }
    ]
  },
  {
    "slug": "rimowa-original-cabin-anodised-aluminium-suitcase",
    "name": "RIMOWA Original Cabin Aluminium Suitcase",
    "brand": "Rimowa",
    "category": "lifestyle",
    "titleLine1": "RIMOWA",
    "titleLine2": "“ORIGINAL CABIN”",
    "accent": "ANODISED ALUMINIUM",
    "tagline": "The Indestructible German Travel Icon with Distinctive Grooves Since 1950",
    "badge": "ICONIC GRAIL",
    "description": "The unmistakable symbol of jet-set travel. Engineered in Germany from robust high-end anodised aluminium with parallel groove architecture, pioneering Multiwheel ball-bearing system, stage-free telescopic handle, and dual TSA-approved combination locks.",
    "care": "Embrace the natural travel patina and stamps. Wipe shell with damp cloth.",
    "warranty": "RIMOWA Lifetime Functional Guarantee.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Material",
        "High-End Anodised Aircraft-Grade Aluminium Alloy"
      ],
      [
        "Dimensions & Weight",
        "55cm x 40cm x 23cm, Volume 35L, Weight 4.3kg (Cabin Size)"
      ],
      [
        "Wheels",
        "RIMOWA Multiwheel System with Ball-Bearing Mounted Axles"
      ],
      [
        "Locks",
        "Two Heavy-Duty Anodised Aluminum TSA Combination Locks"
      ]
    ],
    "variants": [
      {
        "sku": "RIM-ORIG-CAB-SLV",
        "name": "Silver Anodised Aluminium",
        "price": 12400000,
        "compareAt": null,
        "stock": 5,
        "max": 1
      },
      {
        "sku": "RIM-ORIG-CAB-BLK",
        "name": "Matte Black Aluminium",
        "price": 12400000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      }
    ]
  },
  {
    "slug": "rimowa-classic-check-in-l-aluminium-trunk-suitcase",
    "name": "RIMOWA Classic Check-In L Aluminium Suitcase",
    "brand": "Rimowa",
    "category": "lifestyle",
    "titleLine1": "RIMOWA CLASSIC",
    "titleLine2": "“CHECK-IN L”",
    "accent": "HAND-MADE LEATHER",
    "tagline": "Heritage Styling with Hand-Crafted Leather Handles and Riveted Corners",
    "badge": "TOP RATED",
    "description": "Designed for discerning connoisseurs of vintage elegance. Combines shiny high-grade anodised aluminium alloy with hand-made leather carrying handles, high-gloss riveted aluminium corner caps, and German precision engineering for lifelong long-haul journeys.",
    "care": "Condition leather handles occasionally with neutral balm.",
    "warranty": "RIMOWA Lifetime Functional Guarantee.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1581553680321-4fffae59fccd?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1581553680321-4fffae59fccd?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Dimensions",
        "79cm x 53cm x 28cm, Substantial 84L Packing Volume"
      ],
      [
        "Handles",
        "Hand-Made Italian Nappa Leather Grab Handles with Riveting"
      ],
      [
        "Corners",
        "Reinforced Polished Aluminium Riveted Corner Bumpers"
      ],
      [
        "Interior",
        "Flex Divider Height-Adjustable Compression System on Both Sides"
      ]
    ],
    "variants": [
      {
        "sku": "RIM-CLASS-CHKL-SLV",
        "name": "Classic Silver / Black Leather",
        "price": 16200000,
        "compareAt": null,
        "stock": 3,
        "max": 1
      }
    ]
  },
  {
    "slug": "rimowa-essential-trunk-plus-polycarbonate-matte-black",
    "name": "RIMOWA Essential Trunk Plus Matte Black",
    "brand": "Rimowa",
    "category": "lifestyle",
    "titleLine1": "ESSENTIAL TRUNK",
    "titleLine2": "“PLUS 101L”",
    "accent": "POLYCARBONATE",
    "tagline": "Timeless Trunk Silhouette Inspired by Historic Wardrobe Trunks",
    "badge": "FLAGSHIP",
    "description": "Inspired by original wardrobe trunks of the golden age of steamship travel. The Essential Trunk Plus features an oversized, deeper rectangular volume crafted from resilient high-tech polycarbonate that flexes under pressure before snapping back into shape.",
    "care": "Wipe with warm water and isopropyl alcohol if scuffed.",
    "warranty": "RIMOWA Lifetime Functional Guarantee.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1581557991964-125469da3b8a?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1581557991964-125469da3b8a?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Capacity",
        "Immense 101-Liter Capacity with Deep Trunk Architecture"
      ],
      [
        "Shell",
        "Pure High-Tech Impact-Resistant Polycarbonate in Matte Black"
      ],
      [
        "Weight",
        "5.4kg Ultra-Lightweight Considering 101L Volume"
      ],
      [
        "Telescopic Handle",
        "Seamless Stage-Free Height Adjustment System"
      ]
    ],
    "variants": [
      {
        "sku": "RIM-ESS-TRK-MB",
        "name": "Matte Black Polycarbonate",
        "price": 11800000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      }
    ]
  },
  {
    "slug": "rimowa-personal-aluminium-cross-body-case",
    "name": "RIMOWA Personal Aluminium Cross-Body Case",
    "brand": "Rimowa",
    "category": "lifestyle",
    "titleLine1": "PERSONAL",
    "titleLine2": "“ALUMINIUM CLUTCH”",
    "accent": "CROSS-BODY",
    "tagline": "Miniaturized Iconic Grooves Designed to House Daily Essentials in Style",
    "badge": "EDITORIAL CHOICE",
    "description": "Crafted in Germany from ultra-resilient grooved aluminium, the RIMOWA Personal is a unisex hard-shell cross-body case engineered to protect everyday personal valuables. Features removable Italian leather strap, leather interior with zipped pocket, and credit card slots.",
    "care": "Wipe aluminium shell with soft microfiber.",
    "warranty": "RIMOWA 2-year manufacturer warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Shell",
        "Unisex Grooved Anodised Aluminium Hard Protective Shell"
      ],
      [
        "Strap",
        "Removable Adjustable Full-Grain Italian Leather Crossbody Strap"
      ],
      [
        "Interior",
        "Grained Leather with 3 Card Slots & Zipped Center Coin Pocket"
      ],
      [
        "Dimensions",
        "21.5cm Width x 13cm Height x 7cm Depth"
      ]
    ],
    "variants": [
      {
        "sku": "RIM-PERS-ALU-SLV",
        "name": "Silver / Desert Brown Leather",
        "price": 9800000,
        "compareAt": 11000000,
        "stock": 5,
        "max": 2
      }
    ]
  },
  {
    "slug": "rimowa-never-still-flap-backpack-large",
    "name": "RIMOWA Never Still Flap Backpack Large",
    "brand": "Rimowa",
    "category": "lifestyle",
    "titleLine1": "NEVER STILL",
    "titleLine2": "“FLAP BACKPACK”",
    "accent": "CANVAS & LEATHER",
    "tagline": "Contemporary Italian Canvas with Bespoke Grooved Aluminium Monogram Monogram",
    "badge": "NEW ARRIVAL",
    "description": "Designed with the mobile lifestyle in mind. Made in Italy from water-repellent heavyweight canvas and full-grain cowhide leather. Features two side zippered pockets, padded 16-inch laptop pocket, adjustable shoulder straps, and custom bespoke monogram buckles.",
    "care": "Spot clean canvas with cold water. Avoid harsh detergents.",
    "warranty": "RIMOWA 2-year warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Materials",
        "Heavyweight Water-Repellent Canvas & Full-Grain Leather"
      ],
      [
        "Tech Sleeve",
        "Padded Compartment Accommodating Up to 16\" MacBook Pro"
      ],
      [
        "Travel Strap",
        "Integrated Travel Strap for Slipping Over Suitcase Handles"
      ],
      [
        "Hardware",
        "Bespoke Engraved Monogram Magnetic Closure Buckles"
      ]
    ],
    "variants": [
      {
        "sku": "RIM-NS-FLAP-BLK",
        "name": "Black Canvas / Black Leather",
        "price": 9200000,
        "compareAt": null,
        "stock": 6,
        "max": 2
      }
    ]
  },
  {
    "slug": "rimowa-watch-case-3-slot-aluminium",
    "name": "RIMOWA Aluminium 3-Slot Luxury Watch Case",
    "brand": "Rimowa",
    "category": "lifestyle",
    "titleLine1": "WATCH CASE",
    "titleLine2": "“3-SLOT ALUMINIUM”",
    "accent": "MICROFIBER CUSHIONS",
    "tagline": "Cylindrical Anodised Aluminium Vault Protecting 3 Timepieces While Traveling",
    "badge": "LIMITED EDITION",
    "description": "The ultimate horological travel companion. Sculpted in Germany from anodised grooved aluminium with a cylindrical clamshell opening. Inside, three removable padded microfiber cushions cradle your prized mechanical watches in scratch-free sanctuary.",
    "care": "Wipe with dry microfiber cloth. Avoid dropping on hard tile.",
    "warranty": "RIMOWA 2-year manufacturer warranty.",
    "returnDays": 14,
    "hero": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
    "image": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
    "specs": [
      [
        "Body",
        "Solid Anodised Cylindrical Grooved Aluminium Shell"
      ],
      [
        "Capacity",
        "Three Removable Ergonomic Velvet Cushions (Fits Watches up to 48mm)"
      ],
      [
        "Interior",
        "Plush Non-Abrasive Microfiber Lining with Crown Dividers"
      ],
      [
        "Dimensions",
        "26.7cm Length x 11.2cm Diameter, Weight 1.2kg"
      ]
    ],
    "variants": [
      {
        "sku": "RIM-WATCH3-SLV",
        "name": "Silver Aluminium / Microfiber",
        "price": 8500000,
        "compareAt": null,
        "stock": 4,
        "max": 1
      }
    ]
  }
];
