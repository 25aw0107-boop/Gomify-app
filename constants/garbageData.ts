// // constants/garbageData.ts

// export interface GarbageRule {
//   item_id: string;
//   name_jp: string;
//   name_mm: string;
//   name_en: string;
//   category_jp: string;
//   category_mm: string;
//   day_info_jp: string;
//   day_info_mm: string;
//   color: string;
//   instructions_mm: string;
// }

// export interface WardData {
//   ward_id: string;
//   ward_name_jp: string;
//   ward_name_en: string;
//   garbage_rules: GarbageRule[];
// }

// export const TOKYO_GARBAGE_DATABASE: WardData[] = [
//   {
//     ward_id: "TYO-01",
//     ward_name_jp: "新宿区",
//     ward_name_en: "Shinjuku City",
//     garbage_rules: [
//       {
//         item_id: "item_001",
//         name_jp: "ペットボトル",
//         name_mm: "ပလတ်စတစ် ရေသန့်ပုလင်း",
//         name_en: "PET bottle",
//         category_jp: "資源 (ペットボトル)",
//         category_mm: "ပြန်လည်အသုံးပြုနိုင်သော အမှိုက်",
//         day_info_jp: "木",
//         day_info_mm: "ကြာသပတေး",
//         color: "#F59E0B", // Orange/Yellow
//         instructions_mm: "ပုလင်းခွံကို ရေဆေးပါ၊ အညွှန်းခွာပါ၊ အဖုံးနှင့် အညွှန်းကို ပလတ်စတစ်အမှိုက်ထဲ ထည့်ပါ။ ပုလင်းကို ခြေနင်းပြီးမှ စွန့်ပစ်ပါ။"
//       },
//       {
//         item_id: "item_002",
//         name_jp: "可燃ごみ",
//         name_mm: "မီးရှို့နိုင်သောအမှိုက်",
//         name_en: "Burnable Garbage",
//         category_jp: "可燃ごみ",
//         category_mm: "မီးရှို့နိုင်သောအမှိုက်",
//         day_info_jp: "火・金",
//         day_info_mm: "အင်္ဂါ၊ သောကြာ",
//         color: "#EF4444", // Red
//         instructions_mm: "အစားအသောက်အကြွင်းအကျန်များမှ ရေကို သေချာစစ်ပြီးမှ ထည့်ပါ။ သတ်မှတ်ထားသော အမှိုက်အိတ်အကြည် သို့မဟုတ် အဝါရောင်အိတ်ဖြင့် ထည့်ပါ။"
//       },
//       {
//         item_id: "item_003",
//         name_jp: "不燃ごみ",
//         name_mm: "မီးရှို့၍မရသောအမှိုက်",
//         name_en: "Non-burnable Garbage",
//         category_jp: "不燃ごみ",
//         category_mm: "မီးရှို့၍မရသောအမှိုက်",
//         day_info_jp: "第2・4土",
//         day_info_mm: "ဒုတိယနှင့် စတုတ္ထမြောက် စနေ",
//         color: "#3B82F6", // Blue
//         instructions_mm: "ဖန်ကွဲများ၊ ပန်းကန်ခွက်ယောက်ကွဲများကို စက္ကူဖြင့် သေချာထုပ်ပြီး 'キケン' (အန္တရာယ်ရှိသည်) ဟု စာရေးသား၍ စွန့်ပစ်ပါ။"
//       }
//     ]
//   }
// ];

// constants/garbageData.ts

export interface GarbageRule {
  item_id: string;
  name_jp: string;
  category_jp: string;
  day_info_jp: string;
  color: string;
  instructions_jp: string;
}

export interface WardData {
  ward_id: string;
  ward_name_jp: string;
  garbage_rules: GarbageRule[];
}

export const TOKYO_GARBAGE_DATABASE: WardData[] = [
  {
    ward_id: "TYO-01",
    ward_name_jp: "新宿区",
    garbage_rules: [
      {
        item_id: "item_001",
        name_jp: "ペットボトル",
        category_jp: " 資源プラスチック",
        day_info_jp: "木",
        color: "#F59E0B",
        instructions_jp: "キャップとラベルを外し、中を軽くすすいでから潰して資源回収に出してください。"
      },
      {
        item_id: "item_002",
        name_jp: "生ごみ / 可燃ごみ",
        category_jp: " 燃えるごみ",
        day_info_jp: "火・金",
        color: "#EF4444",
        instructions_jp: "生ごみは十分に水切りをしてから、半透明または透明のゴミ袋に入れて出してください。"
      },
      {
        item_id: "item_003",
        name_jp: "陶磁器・ガラス製品・乾電池",
        category_jp: " 燃えないごみ",
        day_info_jp: "第2・4土",
        color: "#3B82F6",
        instructions_jp: "割れたガラスや陶磁器は紙などに包み、「キケン」と表示して出してください。"
      }
    ]
  }
];