// Maps Indonesian food keywords to English search terms for better LoremFlickr results
const SEARCH_MAP: Record<string, string> = {
  // Kopi & espresso
  "dirty latte":         "dirty,latte,espresso,coffee,glass",
  "kopi kelapa":         "coconut,iced,coffee,glass,tropical",
  "kopi pandan":         "pandan,green,coffee,drink,glass",
  "kopi gula merah":     "brown,sugar,palm,iced,coffee",
  "kopi susu aren":      "palm,sugar,iced,latte,coffee,straw",
  "cold brew":           "cold,brew,coffee,jar,black",
  "americano":           "americano,black,coffee,espresso,cup",
  "es kopi susu":        "iced,milk,coffee,glass,straw,latte",
  "matcha latte":        "matcha,green,latte,milk,foam,cup",
  "goguma latte":        "sweet,potato,purple,latte,cup",

  // Boba & bubble tea
  "tiger milk boba":     "tiger,milk,bubble,tea,pearls,brown",
  "cheese boba":         "cheese,foam,milk,tea,boba,cup",
  "brown sugar boba":    "brown,sugar,boba,pearls,milk,tea",
  "thai tea":            "thai,orange,iced,tea,milk,glass",
  "taro milk tea":       "taro,purple,milk,bubble,tea,cup",

  // Minuman tradisional & segar
  "wedang jahe":         "ginger,warm,tea,spice,cup,steam",
  "wedang uwuh":         "herbal,spice,red,warm,drink,cup",
  "teh serai pandan":    "lemongrass,pandan,green,tea,cup",
  "es teh telang":       "butterfly,pea,blue,iced,tea,glass",
  "es teh jeruk madu":   "orange,honey,iced,tea,lemon,glass",
  "cendol":              "cendol,green,jelly,coconut,milk,ice",
  "es teh manis":        "sweet,black,iced,tea,glass,straw",
  "es campur":           "mixed,shaved,ice,fruit,syrup,bowl",
  "jus alpukat":         "avocado,green,smoothie,juice,glass,thick",
  "es buah segar":       "tropical,fruit,salad,ice,glass,bowl",
  "rujak buah":          "fruit,peanut,sauce,bowl,mixed,colorful",

  // Korean food
  "tteokbokki":          "tteokbokki,spicy,red,rice,cake,pan",
  "corn dog korea":      "korean,corn,dog,fried,stick,crispy",
  "hotteok":             "hotteok,korean,sweet,stuffed,pancake,fried",
  "kimbap":              "kimbap,seaweed,rice,roll,sliced,korean",
  "bingsu":              "bingsu,shaved,ice,korean,dessert,bowl",
  "injeolmi toast":      "korean,toast,thick,bread,butter,egg",
  "gohyong":             "crispy,spring,roll,fried,chinese,snack",
  "katsu sando":         "katsu,sandwich,panko,bread,thick,sliced",

  // Street food viral & fusion
  "coklat dubai":        "dubai,chocolate,pistachio,kataifi,bar,dessert",
  "dimsum mentai":       "dimsum,mentai,mayo,sauce,steamed,orange",
  "tanghulu":            "tanghulu,candied,strawberry,skewer,sugar,red",
  "croffle":             "croffle,croissant,waffle,crispy,layered,pastry",
  "tissue bread":        "fluffy,tissue,bread,tall,layered,bakery",
  "roti sopit":          "fried,folded,bread,snack,crispy,street",
  "smash burger":        "smash,burger,patty,melted,cheese,bun",
  "takoyaki":            "takoyaki,octopus,ball,sauce,mayo,bonito",
  "gyoza goreng":        "pan,fried,gyoza,dumpling,crispy,row",
  "okonomiyaki":         "okonomiyaki,japanese,pancake,savory,topped,mayo",
  "udang keju":          "shrimp,cheese,fried,crispy,golden,prawn",

  // Dessert & pastry
  "basque cheesecake":   "basque,burnt,cheesecake,brown,top,slice",
  "tiramisu cup":        "tiramisu,cup,layers,cocoa,dessert,cream",
  "mochi premium":       "mochi,japanese,soft,round,dessert,pastel",
  "donat lumer":         "donut,melted,chocolate,glazed,dripping,sweet",
  "martabak oreo":       "martabak,thick,pancake,chocolate,oreo,filled",
  "martabak matcha":     "martabak,thick,pancake,green,matcha,filled",
  "dessert jar":         "dessert,jar,layered,cream,chocolate,glass",
  "brownies lumer":      "fudge,brownie,melted,chocolate,gooey,square",
  "cheesecake":          "cheesecake,slice,cream,strawberry,plate,dessert",
  "pudding susu":        "milk,pudding,white,silky,caramel,bowl",

  // Jajanan tradisional
  "cilor":               "fried,egg,skewer,street,snack,satay",
  "cireng megalodon":    "large,fried,cassava,round,crispy,snack",
  "jasuke":              "corn,butter,cheese,street,food,cup",
  "risol mayo":          "risoles,fried,roll,mayo,egg,snack",
  "cireng":              "fried,cassava,round,crispy,snack,indonesian",
  "batagor":             "batagor,tofu,fish,dumpling,peanut,sauce",
  "siomay":              "siomay,steamed,dumpling,peanut,sauce,indonesian",
  "tahu bulat":          "round,fried,tofu,crispy,ball,golden",
  "basreng":             "fried,meatball,crispy,spicy,snack,indonesian",
  "keripik pedas":       "spicy,thin,chips,crispy,red,snack",
  "kue cubit":           "mini,bite,pancake,cheese,chocolate,small",
  "klepon":              "klepon,green,pandan,rice,ball,coconut",
  "onde-onde":           "sesame,ball,fried,golden,round,sweet",
  "pisang goreng":       "fried,banana,golden,crispy,fritter,sweet",

  // Makanan berat
  "ayam geprek":         "smashed,fried,chicken,sambal,crispy,spicy",
  "ayam crispy":         "crispy,golden,fried,chicken,crunchy,plate",
  "ayam chili padi":     "spicy,bird,eye,chili,chicken,fried",
  "ayam bakar":          "grilled,chicken,charred,smoky,indonesian,plate",
  "seblak":              "seblak,spicy,cracker,egg,soup,red",
  "mie pedas":           "spicy,red,noodle,bowl,chili,broth",
  "bakso aci":           "meatball,aci,chewy,soup,bowl,skewer",
  "bakso malang":        "meatball,soup,tofu,egg,noodle,bowl",
  "sate taichan":        "chicken,satay,white,lime,sambal,skewer",
  "nasi goreng":         "fried,rice,egg,dark,wok,indonesian",
  "mie ayam":            "chicken,noodle,yellow,bowl,soup,topping",
  "nasi padang":         "padang,rice,rendang,side,dishes,plate",
  "rendang":             "rendang,beef,dark,coconut,dry,spice",
  "pecel lele":          "catfish,fried,crispy,sambal,rice,plate",
  "bebek goreng":        "crispy,fried,duck,sambal,rice,golden",
  "ikan bakar":          "grilled,fish,charcoal,banana,leaf,smoky",
  "nasi uduk":           "steamed,coconut,rice,garnish,egg,emping",
  "bubur ayam":          "chicken,congee,porridge,topping,scallion,bowl",

  // Masakan daerah
  "ketoprak":            "ketoprak,tofu,noodle,peanut,sauce,lontong",
  "gado-gado":           "gado,gado,peanut,sauce,vegetables,tofu",
  "rawon":               "rawon,black,beef,soup,dark,broth",
  "soto betawi":         "soto,betawi,beef,coconut,milk,soup",
  "soto lamongan":       "soto,lamongan,yellow,chicken,soup,vermicelli",
  "nasi kuning":         "yellow,turmeric,rice,cone,festive,garnish",
  "nasi liwet":          "liwet,coconut,rice,banana,leaf,side",
  "lontong sayur":       "lontong,rice,cake,vegetable,coconut,curry",
  "pempek":              "pempek,fish,cake,vinegar,sauce,kuah",
  "coto makassar":       "coto,beef,offal,soup,dark,makassar",
  "mie kocok":           "beef,shank,noodle,yellow,soup,bandung",
  "lumpia semarang":     "lumpia,spring,roll,fried,bamboo,shoot",
  "roti bakar":          "toast,bread,butter,jam,chocolate,grilled",

  // Modern/food biz
  "frozen food homemade":"frozen,food,pack,sealed,homemade,packaging",
  "rice bowl topping":   "rice,bowl,topping,egg,protein,meal",
  "saus mentai":         "mentai,mayo,orange,sauce,drizzle,topping",
};

// Simple hash so each keyword always gets the same image number
function hashKeyword(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return (h % 50) + 1; // 1–50
}

export function getFoodImageUrl(keyword: string): string {
  const key = keyword.toLowerCase().trim();
  const search = SEARCH_MAP[key] ?? `${keyword} food`;
  // LoremFlickr multi-keyword: commas must be literal, not %2C
  const terms = search.replace(/\s+/g, ",");
  const lock = hashKeyword(key);
  return `https://loremflickr.com/320/320/${terms}?lock=${lock}`;
}
