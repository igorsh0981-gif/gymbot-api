import { useState, useEffect, useRef, Fragment } from "react";

const tg = window.Telegram?.WebApp;
const API = "https://web-production-4fe0b.up.railway.app/api";



const C = {
  bg:"#0F0F0F", surface:"#1A1A1A", card:"#222222",
  accent:"#C8FF00", text:"#FFFFFF", muted:"#888888",
  border:"#2A2A2A", danger:"#FF4444", success:"#00CC66", warn:"#FFB800",
};


// ── i18n ─────────────────────────────────────────────────────────────────────
const LANG_STORE = { current: "ru" };
const T = {
  ru: {
    menu_nutrition:"Питание", menu_workout:"Тренировки", menu_progress:"Прогресс",
    menu_catalog:"Каталог", menu_ai:"Тренер", menu_checkin:"Чек-ин",
    menu_measurements:"Замеры тела", menu_goals:"Цели", menu_supplements:"Добавки",
    menu_support:"Поддержка", menu_language:"Язык", menu_sport:"Виды спорта",
    menu_gamification:"Мой статус", menu_food_guide:"Каталог продуктов",
    menu_referral:"Пригласить друга", menu_photo_kbju:"Фото → КБЖУ",
    menu_rest_timer:"Таймер отдыха", menu_plan:"Запланировать", menu_reminders:"Напоминания",
    menu_tab_menu:"Меню", menu_tab_workout:"Тренировки", menu_tab_progress:"Прогресс",
    menu_tab_catalog:"Каталог", menu_tab_ai:"Тренер",
    section_quick:"БЫСТРЫЙ ДОСТУП", section_catalog:"КАТАЛОГ", section_profile:"ПРОФИЛЬ",
    start_workout:"▶ НАЧАТЬ ТРЕНИРОВКУ", back:"← НАЗАД",
    today:"СЕГОДНЯ", loading:"ЗАГРУЗКА", save:"СОХРАНИТЬ", cancel:"ОТМЕНА",
    add:"ДОБАВИТЬ", edit:"ИЗМЕНИТЬ", delete:"УДАЛИТЬ", close:"ЗАКРЫТЬ",
    save_profile:"СОХРАНИТЬ", cancel_btn:"ОТМЕНА", edit_profile:"ИЗМЕНИТЬ ПРОФИЛЬ",
    edit_profile_btn:"ИЗМЕНИТЬ →", profile_title:"МОЙ ПРОФИЛЬ",
    my_profile:"МОЙ ПРОФИЛЬ", not_specified:"Не указано", allergies:"АЛЛЕРГИИ",
    level:"УРОВЕНЬ", goal_label:"ЦЕЛЬ", no_conditions:"Нет противопоказаний",
    no_allergies:"Нет аллергий", reset_btn:"СБРОС", status_label:"СТАТУС",
    fitness_level_label:"УРОВЕНЬ ПОДГОТОВКИ", my_rating:"МОЙ РЕЙТИНГ",
    points_label:"БАЛЛЫ", rank_label:"РАНГ",
    plateau_title:"ПЛАТО ДЕТЕКТОР", plateau_weight:"Вес не меняется",
    plateau_exercise:"Застрявшие упражнения", plateau_none:"Плато не обнаружено",
    referral_title:"ПРИГЛАСИТЬ ДРУГА", referral_your_code:"Твой код",
    referral_link:"Реферальная ссылка", referral_friends:"Приглашено друзей",
    referral_bonus:"Баллов за приглашение",
    workout_title:"ТРЕНИРОВКИ", workouts_title:"ТРЕНИРОВКИ",
    no_workouts:"Тренировок пока нет", no_workouts_yet:"Тренировок пока нет",
    tonnage_label:"ТОННАЖ", no_sport_yet:"Занятий пока нет",
    planned_tab:"📅 ПЛАН", sport_tab:"⚽ СПОРТ", archive_tab:"📋 АРХИВ",
    no_planned:"Нет запланированных тренировок", planned_archive:"АРХИВ ЗАПЛАНИРОВАННЫХ",
    nutrition_title:"ДНЕВНИК", add_meal:"+ добавить",
    water_label:"💧 ВОДА", glasses_unit:"стаканов",
    ask_trainer:"Спросить тренера о питании",
    meal_breakfast:"Завтрак", meal_lunch:"Обед", meal_dinner:"Ужин", meal_snack:"Перекус",
    progress_title:"ПРОГРЕСС", catalog_title:"УПРАЖНЕНИЯ", ai_title:"ТРЕНЕР НА СВЯЗИ",
    food_search_title:"СПРАВОЧНИК", food_search_placeholder:"Поиск продукта...",
    add_to_diary:"ДОБАВИТЬ В ДНЕВНИК", weight_label:"ВЕС (г)",
    sport_record:"ЗАПИСАТЬ ЗАНЯТИЕ", sport_duration:"ПРОДОЛЖИТЕЛЬНОСТЬ (МИН)",
    sport_intensity:"ИНТЕНСИВНОСТЬ", sport_date:"ДАТА", sport_notes:"ЗАМЕТКИ",
    sport_type_label:"ВИД СПОРТА", sport_notes_opt:"ЗАМЕТКИ (ОПЦИОНАЛЬНО)",
    sport_saved:"ЗАПИСАНО", sport_save_btn:"✓ ЗАПИСАТЬ ЗАНЯТИЕ",
    score_opt:"СЧЁТ (ОПЦИОНАЛЬНО)", score_label:"СЧЁТ",
    intensity_low:"🟢 Низкая", intensity_medium:"🟡 Средняя", intensity_high:"🔴 Высокая",
    time_label:"ВРЕМЯ", intensity_label:"ИНТЕНСИВНОСТЬ", calories_label:"КАЛОРИИ",
    archive_label:"АРХИВ",
    choose_type:"ЧТО ДЕЛАЕМ?", choose_type_label:"ВЫБЕРИ ТИП",
    gym_title:"Тренажёрный зал", gym_desc:"Силовые упражнения, выбор мышц и упражнений",
    sport_section:"Виды спорта", sport_desc:"Запись занятия с расчётом калорий",
    sport_section_title:"Виды спорта", sport_section_desc:"Запись занятия с расчётом калорий",
    resume_workout:"ПРОДОЛЖИТЬ ТРЕНИРОВКУ", resume_desc:"У тебя есть незавершённая тренировка",
    finish_workout:"ЗАВЕРШИТЬ", set_done:"✓ ПОДХОД ВЫПОЛНЕН", set_done_label:"ПОДХОД ВЫПОЛНЕН",
    warmup_title:"РАЗМИНКА", warmup_skip:"ПРОПУСТИТЬ", warmup_done:"✓ РАЗМИНКА ВЫПОЛНЕНА",
    warmup_hint:"Кардио для разминки — опционально", warmup_badge:"🏃 РАЗМИНКА",
    order_title:"ПОРЯДОК", order_hint:"↑↓ — перестановка · ↔ — замена",
    muscles_title:"ГРУППЫ МЫШЦ", exercises_title:"УПРАЖНЕНИЯ", replace_title:"ЗАМЕНА",
    select_groups_hint:"Выбери одну или несколько групп → покажем упражнения",
    step_1_4:"ШАГ 1 / 4", step_2_4:"ШАГ 2 / 4", step_3_4:"ШАГ 3 / 4", step_4_4:"ШАГ 4 / 4",
    weight_kg:"ВЕС (КГ)", reps_label:"ПОВТОРЕНИЙ", time_sec:"ВРЕМЯ (СЕК)",
    distance_km:"ДИСТАНЦИЯ (КМ)", prev_btn:"← ПРЕД", next_btn:"СЛЕД →",
    workout_done:"ТРЕНИРОВКА ЗАВЕРШЕНА", workout_complete:"ТРЕНИРОВКА ЗАВЕРШЕНА",
    great_work:"Отличная работа!", analyzing:"АНАЛИЗИРУЕТ ТРЕНИРОВКУ...",
    workout_sets:"СОСТАВ ТРЕНИРОВКИ", no_sets:"Нет записей о подходах", reps_short:"ПОВТ",
    error_label:"ОШИБКА", load_error:"НЕ УДАЛОСЬ ЗАГРУЗИТЬ",
    water_hint:"← нажми чтобы отметить стакан воды",
    ai_thinking:"АНАЛИЗИРУЮ...", ai_ask:"СПРОСИТЬ ТРЕНЕРА", ai_limit:"⚠️ Лимит AI запросов исчерпан",
  },
  en: {
    menu_nutrition:"Nutrition", menu_workout:"Workouts", menu_progress:"Progress",
    menu_catalog:"Catalog", menu_ai:"Coach", menu_checkin:"Check-in",
    menu_measurements:"Body Measurements", menu_goals:"Goals", menu_supplements:"Supplements",
    menu_support:"Support", menu_language:"Language", menu_sport:"Sports",
    menu_gamification:"My Status", menu_food_guide:"Food Catalog",
    menu_referral:"Invite Friend", menu_photo_kbju:"Photo → Calories",
    menu_rest_timer:"Rest Timer", menu_plan:"Schedule", menu_reminders:"Reminders",
    menu_tab_menu:"Menu", menu_tab_workout:"Workouts", menu_tab_progress:"Progress",
    menu_tab_catalog:"Catalog", menu_tab_ai:"Coach",
    section_quick:"QUICK ACCESS", section_catalog:"CATALOG", section_profile:"PROFILE",
    start_workout:"▶ START WORKOUT", back:"← BACK",
    today:"TODAY", loading:"LOADING", save:"SAVE", cancel:"CANCEL",
    add:"ADD", edit:"EDIT", delete:"DELETE", close:"CLOSE",
    save_profile:"SAVE", cancel_btn:"CANCEL", edit_profile:"EDIT PROFILE",
    edit_profile_btn:"EDIT →", profile_title:"MY PROFILE",
    my_profile:"MY PROFILE", not_specified:"Not specified", allergies:"ALLERGIES",
    level:"LEVEL", goal_label:"GOAL", no_conditions:"No conditions",
    no_allergies:"No allergies", reset_btn:"RESET", status_label:"STATUS",
    fitness_level_label:"FITNESS LEVEL", my_rating:"MY RATING",
    points_label:"POINTS", rank_label:"RANK",
    plateau_title:"PLATEAU DETECTOR", plateau_weight:"Weight not changing",
    plateau_exercise:"Stagnant exercises", plateau_none:"No plateau detected",
    referral_title:"INVITE FRIEND", referral_your_code:"Your code",
    referral_link:"Referral link", referral_friends:"Friends invited",
    referral_bonus:"Points per referral",
    workout_title:"WORKOUTS", workouts_title:"WORKOUTS",
    no_workouts:"No workouts yet", no_workouts_yet:"No workouts yet",
    tonnage_label:"TONNAGE", no_sport_yet:"No activities yet",
    planned_tab:"📅 PLAN", sport_tab:"⚽ SPORT", archive_tab:"📋 ARCHIVE",
    no_planned:"No planned workouts", planned_archive:"PLANNED ARCHIVE",
    nutrition_title:"DIARY", add_meal:"+ add",
    water_label:"💧 WATER", glasses_unit:"glasses",
    ask_trainer:"Ask trainer about nutrition",
    meal_breakfast:"Breakfast", meal_lunch:"Lunch", meal_dinner:"Dinner", meal_snack:"Snack",
    progress_title:"PROGRESS", catalog_title:"EXERCISES", ai_title:"COACH ONLINE",
    food_search_title:"CATALOG", food_search_placeholder:"Search product...",
    add_to_diary:"ADD TO DIARY", weight_label:"WEIGHT (g)",
    sport_record:"LOG ACTIVITY", sport_duration:"DURATION (MIN)",
    sport_intensity:"INTENSITY", sport_date:"DATE", sport_notes:"NOTES",
    sport_type_label:"SPORT TYPE", sport_notes_opt:"NOTES (OPTIONAL)",
    sport_saved:"RECORDED", sport_save_btn:"✓ LOG ACTIVITY",
    score_opt:"SCORE (OPTIONAL)", score_label:"SCORE",
    intensity_low:"🟢 Low", intensity_medium:"🟡 Medium", intensity_high:"🔴 High",
    time_label:"TIME", intensity_label:"INTENSITY", calories_label:"CALORIES",
    archive_label:"ARCHIVE",
    choose_type:"WHAT ARE WE DOING?", choose_type_label:"CHOOSE TYPE",
    gym_title:"Gym", gym_desc:"Strength exercises, muscle and exercise selection",
    sport_section:"Sports", sport_desc:"Log activity with calorie calculation",
    sport_section_title:"Sports", sport_section_desc:"Log activity with calorie calculation",
    resume_workout:"CONTINUE WORKOUT", resume_desc:"You have an unfinished workout",
    finish_workout:"FINISH", set_done:"✓ SET DONE", set_done_label:"SET DONE",
    warmup_title:"WARM UP", warmup_skip:"SKIP", warmup_done:"✓ WARM UP DONE",
    warmup_hint:"Cardio for warm-up — optional", warmup_badge:"🏃 WARM UP",
    order_title:"ORDER", order_hint:"↑↓ — reorder · ↔ — replace",
    muscles_title:"MUSCLE GROUPS", exercises_title:"EXERCISES", replace_title:"REPLACE",
    select_groups_hint:"Select one or more groups → we'll show exercises",
    step_1_4:"STEP 1 / 4", step_2_4:"STEP 2 / 4", step_3_4:"STEP 3 / 4", step_4_4:"STEP 4 / 4",
    weight_kg:"WEIGHT (KG)", reps_label:"REPS", time_sec:"TIME (SEC)",
    distance_km:"DISTANCE (KM)", prev_btn:"← PREV", next_btn:"NEXT →",
    workout_done:"WORKOUT COMPLETE", workout_complete:"WORKOUT COMPLETE",
    great_work:"Great work!", analyzing:"ANALYZING WORKOUT...",
    workout_sets:"WORKOUT SETS", no_sets:"No set records", reps_short:"REPS",
    error_label:"ERROR", load_error:"FAILED TO LOAD",
    water_hint:"← tap to log a glass of water",
    ai_thinking:"ANALYZING...", ai_ask:"ASK COACH", ai_limit:"⚠️ AI request limit reached",
  },
  uz: {
    menu_nutrition:"Ovqatlanish", menu_workout:"Mashqlar", menu_progress:"Taraqqiyot",
    menu_catalog:"Katalog", menu_ai:"Murabbiy", menu_checkin:"Tekshiruv",
    menu_measurements:"Tana o'lchovlari", menu_goals:"Maqsadlar", menu_supplements:"Qo'shimchalar",
    menu_support:"Yordam", menu_language:"Til", menu_sport:"Sport turlari",
    menu_gamification:"Mening statusim", menu_food_guide:"Mahsulotlar katalogi",
    menu_referral:"Do'st taklif qilish", menu_photo_kbju:"Foto → Kaloriya",
    menu_rest_timer:"Dam olish taymer", menu_plan:"Rejalashtirish", menu_reminders:"Eslatmalar",
    menu_tab_menu:"Menyu", menu_tab_workout:"Mashqlar", menu_tab_progress:"Taraqqiyot",
    menu_tab_catalog:"Katalog", menu_tab_ai:"Murabbiy",
    section_quick:"TEZKOR KIRISH", section_catalog:"KATALOG", section_profile:"PROFIL",
    start_workout:"▶ MASHQNI BOSHLASH", back:"← ORQAGA",
    today:"BUGUN", loading:"YUKLANMOQDA", save:"SAQLASH", cancel:"BEKOR QILISH",
    add:"QO'SHISH", edit:"O'ZGARTIRISH", delete:"O'CHIRISH", close:"YOPISH",
    save_profile:"SAQLASH", cancel_btn:"BEKOR QILISH", edit_profile:"PROFILNI TAHRIRLASH",
    edit_profile_btn:"O'ZGARTIRISH →", profile_title:"MENING PROFILIM",
    my_profile:"MENING PROFILIM", not_specified:"Ko'rsatilmagan", allergies:"ALLERGIYALAR",
    level:"DARAJA", goal_label:"MAQSAD", no_conditions:"Cheklovlar yo'q",
    no_allergies:"Allergiya yo'q", reset_btn:"TOZALASH", status_label:"STATUS",
    fitness_level_label:"TAYYORGARLIK DARAJASI", my_rating:"MENING REYTINGIM",
    points_label:"BALLLAR", rank_label:"DARAJA",
    plateau_title:"PLATO DETEKTORI", plateau_weight:"Vazn o'zgarmayapti",
    plateau_exercise:"Qotib qolgan mashqlar", plateau_none:"Plato aniqlanmadi",
    referral_title:"DO'ST TAKLIF QILISH", referral_your_code:"Sizning kodingiz",
    referral_link:"Referal havola", referral_friends:"Taklif qilingan do'stlar",
    referral_bonus:"Taklif uchun balllar",
    workout_title:"MASHQLAR", workouts_title:"MASHQLAR",
    no_workouts:"Hali mashqlar yo'q", no_workouts_yet:"Hali mashqlar yo'q",
    tonnage_label:"TONNAJ", no_sport_yet:"Hali mashg'ulotlar yo'q",
    planned_tab:"📅 REJA", sport_tab:"⚽ SPORT", archive_tab:"📋 ARXIV",
    no_planned:"Rejalashtirilgan mashqlar yo'q", planned_archive:"REJALASHTIRILGAN ARXIV",
    nutrition_title:"KUNDALIK", add_meal:"+ qo'shish",
    water_label:"💧 SUV", glasses_unit:"stakan",
    ask_trainer:"Ovqatlanish haqida murabbiydan so'rash",
    meal_breakfast:"Nonushta", meal_lunch:"Tushlik", meal_dinner:"Kechki ovqat", meal_snack:"Gazak",
    progress_title:"TARAQQIYOT", catalog_title:"MASHQLAR", ai_title:"MURABBIY",
    food_search_title:"KATALOG", food_search_placeholder:"Mahsulot qidirish...",
    add_to_diary:"KUNDALIKKA QO'SHISH", weight_label:"OG'IRLIK (g)",
    sport_record:"MASHG'ULOT YOZISH", sport_duration:"DAVOMIYLIGI (DAQIQA)",
    sport_intensity:"INTENSIVLIK", sport_date:"SANA", sport_notes:"IZOHLAR",
    sport_type_label:"SPORT TURI", sport_notes_opt:"IZOHLAR (IXTIYORIY)",
    sport_saved:"YOZILDI", sport_save_btn:"✓ MASHG'ULOTNI YOZ",
    score_opt:"NATIJA (IXTIYORIY)", score_label:"NATIJA",
    intensity_low:"🟢 Past", intensity_medium:"🟡 O'rta", intensity_high:"🔴 Yuqori",
    time_label:"VAQT", intensity_label:"INTENSIVLIK", calories_label:"KALORIYA",
    archive_label:"ARXIV",
    choose_type:"NIMA QILAMIZ?", choose_type_label:"TURNI TANLANG",
    gym_title:"Sport zali", gym_desc:"Kuch mashqlari, mushak va mashq tanlash",
    sport_section:"Sport turlari", sport_desc:"Kaloriya hisobi bilan mashg'ulotni yozish",
    sport_section_title:"Sport turlari", sport_section_desc:"Kaloriya hisobi bilan mashg'ulotni yozish",
    resume_workout:"MASHQNI DAVOM ETTIRISH", resume_desc:"Tugallanmagan mashqingiz bor",
    finish_workout:"TUGATISH", set_done:"✓ YONDASHUV BAJARILDI", set_done_label:"YONDASHUV BAJARILDI",
    warmup_title:"ISITISH", warmup_skip:"O'TKAZIB YUBORISH", warmup_done:"✓ ISITISH BAJARILDI",
    warmup_hint:"Isitish uchun kardio — ixtiyoriy", warmup_badge:"🏃 ISITISH",
    order_title:"TARTIB", order_hint:"↑↓ — qayta joylashtirish · ↔ — almashtirish",
    muscles_title:"MUSHAK GURUHLARI", exercises_title:"MASHQLAR", replace_title:"ALMASHTIRISH",
    select_groups_hint:"Bir yoki bir nechta guruh tanlang → mashqlarni ko'rsatamiz",
    step_1_4:"QADAM 1 / 4", step_2_4:"QADAM 2 / 4", step_3_4:"QADAM 3 / 4", step_4_4:"QADAM 4 / 4",
    weight_kg:"OG'IRLIK (KG)", reps_label:"MARTA", time_sec:"VAQT (SEK)",
    distance_km:"MASOFA (KM)", prev_btn:"← OLDINGI", next_btn:"KEYINGI →",
    workout_done:"MASHQ YAKUNLANDI", workout_complete:"MASHQ YAKUNLANDI",
    great_work:"Zo'r ish!", analyzing:"MASHQ TAHLIL QILINMOQDA...",
    workout_sets:"MASHQ TARKIBI", no_sets:"Yondashuv yozuvlari yo'q", reps_short:"MARTA",
    error_label:"XATO", load_error:"YUKLAB BO'LMADI",
    water_hint:"← bir stakan suv belgisi uchun bosing",
    ai_thinking:"TAHLIL QILMOQDA...", ai_ask:"MURABBIYDAN SO'RASH", ai_limit:"⚠️ AI so'rovlar limiti tugadi",
  },
  kz: {
    menu_nutrition:"Тамақтану", menu_workout:"Жаттығулар", menu_progress:"Прогресс",
    menu_catalog:"Каталог", menu_ai:"Жаттықтырушы", menu_checkin:"Тексеру",
    menu_measurements:"Дене өлшемдері", menu_goals:"Мақсаттар", menu_supplements:"Қоспалар",
    menu_support:"Қолдау", menu_language:"Тіл", menu_sport:"Спорт түрлері",
    menu_gamification:"Менің статусым", menu_food_guide:"Өнімдер каталогы",
    menu_referral:"Досты шақыру", menu_photo_kbju:"Фото → Калория",
    menu_rest_timer:"Демалыс таймері", menu_plan:"Жоспарлау", menu_reminders:"Еске салулар",
    menu_tab_menu:"Мәзір", menu_tab_workout:"Жаттығулар", menu_tab_progress:"Прогресс",
    menu_tab_catalog:"Каталог", menu_tab_ai:"Жаттықтырушы",
    section_quick:"ЖЫЛДАМ ҚАТЫНАС", section_catalog:"КАТАЛОГ", section_profile:"ПРОФИЛЬ",
    start_workout:"▶ ЖАТТЫҒУДЫ БАСТАУ", back:"← АРТҚА",
    today:"БҮГІН", loading:"ЖҮКТЕЛУДЕ", save:"САҚТАУ", cancel:"БОЛДЫРМАУ",
    add:"ҚОСУ", edit:"ӨЗГЕРТУ", delete:"ЖОЮ", close:"ЖАБУ",
    save_profile:"САҚТАУ", cancel_btn:"БОЛДЫРМАУ", edit_profile:"ПРОФИЛЬДІ ӨЗГЕРТУ",
    edit_profile_btn:"ӨЗГЕРТУ →", profile_title:"МЕНІҢ ПРОФИЛІМ",
    my_profile:"МЕНІҢ ПРОФИЛІМ", not_specified:"Көрсетілмеген", allergies:"АЛЛЕРГИЯЛАР",
    level:"ДЕҢГЕЙ", goal_label:"МАҚСАТ", no_conditions:"Шектеулер жоқ",
    no_allergies:"Аллергия жоқ", reset_btn:"ТАЗАЛАУ", status_label:"СТАТУС",
    fitness_level_label:"ДАЙЫНДЫҚ ДЕҢГЕЙІ", my_rating:"МЕНІҢ РЕЙТИНГІМ",
    points_label:"БАЛЛДАР", rank_label:"ДӘРЕЖЕ",
    plateau_title:"ПЛАТО ДЕТЕКТОРЫ", plateau_weight:"Салмақ өзгермейді",
    plateau_exercise:"Тоқырап қалған жаттығулар", plateau_none:"Плато анықталмады",
    referral_title:"ДОСТЫ ШАҚЫРУ", referral_your_code:"Сіздің кодыңыз",
    referral_link:"Реферал сілтеме", referral_friends:"Шақырылған достар",
    referral_bonus:"Шақыру үшін балл",
    workout_title:"ЖАТТЫҒУЛАР", workouts_title:"ЖАТТЫҒУЛАР",
    no_workouts:"Әлі жаттығулар жоқ", no_workouts_yet:"Әлі жаттығулар жоқ",
    tonnage_label:"ТОННАЖ", no_sport_yet:"Әлі сабақтар жоқ",
    planned_tab:"📅 ЖОСПАР", sport_tab:"⚽ СПОРТ", archive_tab:"📋 МҰРАҒАТ",
    no_planned:"Жоспарланған жаттығулар жоқ", planned_archive:"ЖОСПАРЛАНҒАН МҰРАҒАТ",
    nutrition_title:"КҮНДЕЛІК", add_meal:"+ қосу",
    water_label:"💧 СУ", glasses_unit:"стакан",
    ask_trainer:"Тамақтану туралы жаттықтырушыдан сұрау",
    meal_breakfast:"Таңғы ас", meal_lunch:"Түскі ас", meal_dinner:"Кешкі ас", meal_snack:"Тағамдық",
    progress_title:"ПРОГРЕСС", catalog_title:"ЖАТТЫҒУЛАР", ai_title:"ЖАТТЫҚТЫРУШЫ",
    food_search_title:"КАТАЛОГ", food_search_placeholder:"Өнімді іздеу...",
    add_to_diary:"КҮНДЕЛІККЕ ҚОСУ", weight_label:"САЛМАҚ (г)",
    sport_record:"САБАҚТЫ ЖАЗ", sport_duration:"ҰЗАҚТЫҒЫ (МИН)",
    sport_intensity:"ҚАРҚЫНДЫЛЫҚ", sport_date:"КҮН", sport_notes:"ЖАЗБАЛАР",
    sport_type_label:"СПОРТ ТҮРІ", sport_notes_opt:"ЖАЗБАЛАР (МІНДЕТТІ ЕМЕС)",
    sport_saved:"ЖАЗЫЛДЫ", sport_save_btn:"✓ САБАҚТЫ ЖАЗ",
    score_opt:"НӘТИЖЕ (МІНДЕТТІ ЕМЕС)", score_label:"НӘТИЖЕ",
    intensity_low:"🟢 Төмен", intensity_medium:"🟡 Орташа", intensity_high:"🔴 Жоғары",
    time_label:"УАҚЫТ", intensity_label:"ҚАРҚЫНДЫЛЫҚ", calories_label:"КАЛОРИЯ",
    archive_label:"МҰРАҒАТ",
    choose_type:"НЕ ЖАСАЙМЫЗ?", choose_type_label:"ТҮРДІ ТАҢДАҢЫЗ",
    gym_title:"Жаттығу залы", gym_desc:"Күш жаттығулары, бұлшықет пен жаттығу таңдау",
    sport_section:"Спорт түрлері", sport_desc:"Калория есебімен сабақты жазу",
    sport_section_title:"Спорт түрлері", sport_section_desc:"Калория есебімен сабақты жазу",
    resume_workout:"ЖАТТЫҒУДЫ ЖАЛҒАСТЫРУ", resume_desc:"Аяқталмаған жаттығуыңыз бар",
    finish_workout:"АЯҚТАУ", set_done:"✓ ЖОЛДАС ОРЫНДАЛДЫ", set_done_label:"ЖОЛДАС ОРЫНДАЛДЫ",
    warmup_title:"ЖЫЛЫТУ", warmup_skip:"ӨТКІЗІП ЖІБЕРу", warmup_done:"✓ ЖЫЛЫТУ ОРЫНДАЛДЫ",
    warmup_hint:"Жылыту үшін кардио — міндетті емес", warmup_badge:"🏃 ЖЫЛЫТУ",
    order_title:"ТӘРТІП", order_hint:"↑↓ — қайта орналастыру · ↔ — ауыстыру",
    muscles_title:"БҰЛШЫҚЕТ ТОПТАРЫ", exercises_title:"ЖАТТЫҒУЛАР", replace_title:"АУЫСТЫРУ",
    select_groups_hint:"Бір немесе бірнеше топ таңдаңыз → жаттығуларды көрсетеміз",
    step_1_4:"ҚАДАМ 1 / 4", step_2_4:"ҚАДАМ 2 / 4", step_3_4:"ҚАДАМ 3 / 4", step_4_4:"ҚАДАМ 4 / 4",
    weight_kg:"САЛМАҚ (КГ)", reps_label:"РЕТ", time_sec:"УАҚЫТ (СЕК)",
    distance_km:"ҚАШЫҚТЫҚ (КМ)", prev_btn:"← АЛДЫҢҒЫ", next_btn:"КЕЛЕСІ →",
    workout_done:"ЖАТТЫҒУ АЯҚТАЛДЫ", workout_complete:"ЖАТТЫҒУ АЯҚТАЛДЫ",
    great_work:"Тамаша жұмыс!", analyzing:"ЖАТТЫҒУ ТАЛДАНУДА...",
    workout_sets:"ЖАТТЫҒУ ҚҰРАМЫ", no_sets:"Жазбалар жоқ", reps_short:"РЕТ",
    error_label:"ҚАТЕ", load_error:"ЖҮКТЕУ МҮМКІН ЕМЕС",
    water_hint:"← бір стакан су белгілеу үшін басыңыз",
    ai_thinking:"ТАЛДАНУДА...", ai_ask:"ЖАТТЫҚТЫРУШЫДАН СҰРАу", ai_limit:"⚠️ AI сұраулар лимиті таусылды",
  },
};
function t(key) { return T[LANG_STORE.current]?.[key] || T.ru[key] || key; }


const Hero = ({children,style={}}) => <div style={{fontWeight:700,fontSize:26,letterSpacing:-0.5,lineHeight:1.15,color:C.text,textTransform:"uppercase",...style}}>{children}</div>;
const Kicker = ({children}) => <div style={{fontFamily:"monospace",fontSize:11,color:C.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>{children}</div>;
const Mono = ({children,color=C.accent,size=18}) => <span style={{fontFamily:"monospace",fontWeight:700,fontSize:size,color}}>{children}</span>;

function Card({children,accent,danger,onClick,style={},pad="14px 16px"}){
  const border = accent?C.accent:danger?C.danger:C.border;
  return <div onClick={onClick} style={{background:C.card,border:`0.5px solid ${border}`,borderRadius:12,padding:pad,cursor:onClick?"pointer":"default",...style}}>{children}</div>;
}
function Loader({text="ЗАГРУЗКА"}){
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh"}}><div style={{textAlign:"center"}}><div style={{fontFamily:"monospace",fontSize:12,color:C.accent,letterSpacing:3}}>{text}</div><div style={{color:C.muted,fontSize:24,marginTop:8}}>◌</div></div></div>;
}
function BackBtn({onBack}){
  return <button onClick={onBack} style={{background:"none",border:"none",color:C.muted,fontFamily:"monospace",fontSize:12,letterSpacing:1,cursor:"pointer",padding:"0 0 16px 0",display:"block"}}>{t("back")}</button>;
}
function Btn({children,onClick,accent,danger,disabled,full,style={}}){
  const bg=accent?C.accent:danger?"#FF444422":C.card;
  const bc=accent?C.accent:danger?C.danger:C.border;
  const col=accent?C.bg:danger?C.danger:C.text;
  return <button onClick={onClick} disabled={disabled} style={{width:full?"100%":"auto",background:bg,border:`0.5px solid ${bc}`,borderRadius:10,padding:"13px 20px",color:col,fontWeight:700,fontSize:14,letterSpacing:0.5,textTransform:"uppercase",cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,...style}}>{children}</button>;
}
function Sel({value,onChange,options}){
  return <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:13,fontFamily:"monospace",outline:"none",boxSizing:"border-box"}}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}
function Tag({children,color=C.muted,bg}){
  return <span style={{background:bg||`${color}22`,border:`0.5px solid ${color}`,borderRadius:16,padding:"4px 10px",fontSize:12,color,display:"inline-block"}}>{children}</span>;
}
function ProgressBar({pct,color=C.accent}){
  return <div style={{background:C.border,borderRadius:4,height:6}}><div style={{width:`${Math.min(100,pct)}%`,height:"100%",background:pct>100?C.danger:color,borderRadius:4,transition:"width 0.4s"}}/></div>;
}

const MEDICAL_OPTIONS=[
  {key:"knee_injury",label:"🦵 Травма колена"},{key:"back_pain",label:"🔙 Боль в спине"},
  {key:"spine_issues",label:"🦴 Позвоночник"},{key:"shoulder_injury",label:"💪 Плечо/ротатор"},
  {key:"heart_disease",label:"❤️ Сердце/сосуды"},{key:"hypertension",label:"🩺 Гипертония"},
  {key:"hernia",label:"⚠️ Грыжа"},{key:"kidney_disease",label:"🫘 Почки"},{key:"diabetes",label:"💉 Диабет"},
];
const ALLERGY_OPTIONS=[
  {key:"lactose",label:"🥛 Лактоза"},{key:"gluten",label:"🌾 Глютен"},
  {key:"nuts",label:"🥜 Орехи"},{key:"soy",label:"🫘 Соя"},
  {key:"fish_oil",label:"🐟 Рыбий жир"},{key:"eggs",label:"🥚 Яйца"},
];
const MEDICAL_LABELS=Object.fromEntries(MEDICAL_OPTIONS.map(o=>[o.key,o.label]));
const ALLERGY_LABELS=Object.fromEntries(ALLERGY_OPTIONS.map(o=>[o.key,o.label]));
const GOAL_LABELS={lose_weight:"Похудение",gain_muscle:"Набор массы",gain_strength:"Сила",improve_endurance:"Выносливость",stay_healthy:"Здоровье"};
const LEVEL_LABELS={beginner:"Новичок",intermediate:"Средний",advanced:"Продвинутый"};
const DIFF_COLOR={easy:C.success,medium:C.accent,hard:C.danger};
const DIFF_LABEL={easy:"Лёгкое",medium:"Среднее",hard:"Сложное"};
const CARDIO_DISTANCE=["бег трусцой","интервальный бег","велосипед на улице","ходьба на беговой дорожке","бег на месте"];
const CARDIO_TIME=["зумба","танцевальная аэробика","степ-аэробика","плавание","кардио на лестнице","велотренажёр","эллиптический тренажёр"];

function cardioType(ex={}){
  // Приоритет 1: muscle_group_id=9 — всегда кардио
  if(ex.muscle_group_id===9){
    const n=(ex.name||"").toLowerCase();
    if(CARDIO_DISTANCE.some(c=>n.includes(c)||c.includes(n)))return "distance";
    if(ex.exercise_type==="cardio_distance")return "distance";
    return "time"; // все кардио по умолчанию = время
  }
  // Приоритет 2: exercise_type из БД
  if(ex.exercise_type==="cardio_distance")return "distance";
  if(ex.exercise_type==="cardio_time")return "time";
  // Приоритет 3: fallback по названию
  const n=(ex.name||"").toLowerCase();
  if(CARDIO_DISTANCE.some(c=>n.includes(c)||c.includes(n)))return "distance";
  if(CARDIO_TIME.some(c=>n.includes(c)||c.includes(n)))return "time";
  return null; // силовое
}

function CheckboxGroup({options,selected,onChange}){
  const toggle=key=>onChange(selected.includes(key)?selected.filter(k=>k!==key):[...selected,key]);
  return <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
    {options.map(o=>{const a=selected.includes(o.key);return(
      <button key={o.key} onClick={()=>toggle(o.key)} style={{padding:"7px 12px",borderRadius:20,fontSize:12,cursor:"pointer",background:a?C.accent:C.bg,border:`0.5px solid ${a?C.accent:C.border}`,color:a?C.bg:C.muted,fontWeight:a?700:400}}>{o.label}</button>
    );})}
  </div>;
}


function RestTimer({onClose}){
  const PRESETS=[60,90,120,180];
  const [total,setTotal]=useState(90);
  const [left,setLeft]=useState(null); // null = не запущен
  const [running,setRunning]=useState(false);
  const intervalRef=useRef(null);

  function start(sec){
    setTotal(sec);setLeft(sec);setRunning(true);
  }
  function pause(){setRunning(false);}
  function resume(){setRunning(true);}
  function reset(){setRunning(false);setLeft(null);}
  function addTime(sec){setLeft(p=>p!=null?Math.max(0,p+sec):sec);}

  useEffect(()=>{
    if(!running)return;
    intervalRef.current=setInterval(()=>{
      setLeft(p=>{
        if(p<=1){
          setRunning(false);
          if(navigator.vibrate)navigator.vibrate([200,100,200,100,400]);
          // Звуковой сигнал через Web Audio API (работает на iOS и Android)
          try{
            const ctx=new(window.AudioContext||window.webkitAudioContext)();
            const beep=(freq,start,dur)=>{
              const o=ctx.createOscillator();
              const g=ctx.createGain();
              o.connect(g);g.connect(ctx.destination);
              o.frequency.value=freq;
              g.gain.setValueAtTime(0.4,ctx.currentTime+start);
              g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+start+dur);
              o.start(ctx.currentTime+start);
              o.stop(ctx.currentTime+start+dur);
            };
            beep(880,0,0.15);beep(880,0.2,0.15);beep(1100,0.4,0.3);
          }catch{}
          return 0;
        }
        return p-1;
      });
    },1000);
    return()=>clearInterval(intervalRef.current);
  },[running]);

  const pct=left!=null?Math.round((1-left/total)*100):0;
  const fmt=s=>{if(s==null)return"--:--";const m=Math.floor(s/60);const sec=s%60;return`${m}:${sec.toString().padStart(2,"0")}`;};
  const done=left===0;

  return(
    <Fragment>
    <div style={{position:"fixed",bottom:0,left:0,right:0,top:0,zIndex:199,background:"rgba(0,0,0,0.6)"}} onClick={e=>{if(e.target===e.currentTarget){reset();onClose();}}}/>
    <div style={{position:"fixed",bottom:"calc(70px + env(safe-area-inset-bottom))",left:16,right:16,background:C.surface,border:`0.5px solid ${done?C.success:C.accent}`,borderRadius:16,padding:"16px",zIndex:200,boxShadow:"0 -4px 24px rgba(0,0,0,0.4)"}}>
      {/* Прогресс-бар */}
      <div style={{background:C.border,borderRadius:4,height:4,marginBottom:12,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:done?C.success:C.accent,borderRadius:4,transition:"width 1s linear"}}/>
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div>
          <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:2}}>
            {done?"✓ ОТДЫХ ЗАВЕРШЁН":left!=null?"ОТДЫХ":"ВЫБЕРИ ВРЕМЯ"}
          </div>
          <div style={{fontSize:36,fontFamily:"monospace",fontWeight:700,color:done?C.success:C.accent,lineHeight:1}}>
            {fmt(left)}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {left!=null&&!done&&(
            <button onClick={running?pause:resume}
              style={{background:C.accent,border:"none",borderRadius:10,padding:"8px 16px",color:C.bg,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"monospace"}}>
              {running?"⏸ ПАУЗА":"▶ СТАРТ"}
            </button>
          )}
          <button onClick={()=>{reset();onClose();}}
            style={{background:"none",border:`0.5px solid ${C.border}`,borderRadius:10,padding:"8px 12px",color:C.muted,fontSize:13,cursor:"pointer"}}>
            ✕
          </button>
        </div>
      </div>

      {left!=null&&!done?(
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>addTime(30)} style={{flex:1,background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px",color:C.text,fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>+30 сек</button>
          <button onClick={()=>addTime(-15)} style={{flex:1,background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px",color:C.muted,fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>−15 сек</button>
          <button onClick={reset} style={{flex:1,background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px",color:C.danger,fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>СБРОС</button>
        </div>
      ):(
        <div style={{display:"flex",gap:6}}>
          {PRESETS.map(s=>(
            <button key={s} onClick={()=>start(s)}
              style={{flex:1,background:done&&total===s?C.success:C.card,border:`0.5px solid ${done&&total===s?C.success:C.border}`,borderRadius:8,padding:"8px 4px",color:done&&total===s?"#fff":C.muted,fontSize:12,fontFamily:"monospace",cursor:"pointer",fontWeight:done&&total===s?700:400}}>
              {s}с
            </button>
          ))}
        </div>
      )}
    </div>
    </Fragment>
  );
}

function NavBar({active,onChange}){
  const tabs=[{id:"menu",icon:"⊞",label:t("menu_tab_menu")},{id:"workout",icon:"▶",label:t("menu_tab_workout")},{id:"progress",icon:"↗",label:t("menu_tab_progress")},{id:"catalog",icon:"☰",label:t("menu_tab_catalog")},{id:"ai",icon:"●",label:t("menu_tab_ai")}];
  return <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`0.5px solid ${C.border}`,display:"flex",padding:"8px 0 calc(8px + env(safe-area-inset-bottom))",zIndex:100}}>
    {tabs.map(t=><button key={t.id} onClick={()=>onChange(t.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0"}}>
      <span style={{fontSize:18,color:active===t.id?C.accent:C.muted}}>{t.icon}</span>
      <span style={{fontSize:10,fontFamily:"monospace",letterSpacing:0.5,color:active===t.id?C.accent:C.muted}}>{t.label}</span>
    </button>)}
  </div>;
}

function ExCard({ex,onClick,badge,action}){
  return <Card onClick={onClick} style={{marginBottom:8}}>
    <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
      {ex.photo_url&&<img src={ex.photo_url} alt="" style={{width:56,height:56,borderRadius:8,objectFit:"cover",flexShrink:0}} onError={e=>e.target.style.display="none"}/>}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
          <div style={{fontWeight:600,fontSize:14,color:C.text,lineHeight:1.3}}>{ex.name}</div>
          {badge&&<Tag color={DIFF_COLOR[ex.difficulty]||C.muted}>{badge}</Tag>}
        </div>
        <div style={{fontSize:11,color:C.muted,marginTop:3}}>{ex.group_emoji} {ex.group_name}</div>
        <div style={{display:"flex",gap:10,marginTop:6}}>
          <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{ex.sets_recommended} подх</span>
          <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{ex.reps_recommended} повт</span>
          {ex.equipment&&<span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{ex.equipment}</span>}
        </div>
      </div>
      {action}
    </div>
  </Card>;
}



// ─── ONBOARDING ──────────────────────────────────────────────────────────────
function OnboardingScreen({tgId,tgUser,onComplete}){
  const [step,setStep]=useState(1);
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");
  const [name,setName]=useState(tgUser?.first_name||"");
  const [goal,setGoal]=useState("stay_healthy");

  async function finish(){
    if(!tgId){setErr("Открой приложение через Telegram.");return;}
    setSaving(true);setErr("");
    try{
      const body={
        telegram_id:tgId,
        first_name:(name||"").trim()||tgUser?.first_name||"Атлет",
        username:tgUser?.username||null,
        desired_result:goal,
        lang:LANG_STORE.current||"ru",
        fitness_level:"beginner",
      };
      const res=await fetch(`${API}/user/create`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      if(!res.ok)throw new Error("server");
      // Применяем реферальный код если есть
      const refCode=sessionStorage.getItem("gymbot_ref_code");
      if(refCode&&tgId){
        try{
          await fetch(`${API}/referral/apply?tg_id=${tgId}&ref_code=${refCode}`,{method:"POST"});
          sessionStorage.removeItem("gymbot_ref_code");
        }catch{}
      }
      onComplete();
    }catch(e){setErr("Ошибка. Попробуй ещё раз.");setSaving(false);}
  }

  const goals=[
    {v:"lose_weight",icon:"⚖️",label:"Похудение"},
    {v:"gain_muscle",icon:"💪",label:"Набор массы"},
    {v:"gain_strength",icon:"🏋️",label:"Сила"},
    {v:"improve_endurance",icon:"🏃",label:"Выносливость"},
    {v:"stay_healthy",icon:"❤️",label:"Здоровье"},
  ];

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{height:3,background:C.border}}>
        <div style={{height:3,background:C.accent,width:step===1?"50%":"100%",transition:"width 0.3s"}}/>
      </div>
      <div style={{flex:1,padding:"32px 20px 24px",display:"flex",flexDirection:"column"}}>
        {step===1&&<Fragment>
          <div style={{fontFamily:"monospace",fontSize:10,color:C.muted,letterSpacing:2,marginBottom:16}}>ШАГ 1 / 2</div>
          <Hero style={{marginBottom:8}}>ПРИВЕТ! КАК ТЕБЯ ЗОВУТ?</Hero>
          <div style={{fontSize:13,color:C.muted,marginBottom:28}}>Имя будет отображаться в приложении</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder={tgUser?.first_name||"Твоё имя"} maxLength={40} autoFocus
            style={{width:"100%",background:C.card,border:`1px solid ${(name||"").trim()?C.accent:C.border}`,borderRadius:10,padding:"14px 16px",color:C.text,fontSize:18,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          {err&&<div style={{marginTop:12,padding:"10px 14px",background:"rgba(255,68,68,0.1)",border:`1px solid ${C.danger}`,borderRadius:8,color:C.danger,fontSize:13}}>{err}</div>}
          <div style={{flex:1}}/>
          <Btn accent full onClick={()=>setStep(2)} style={{marginTop:24}}>ДАЛЕЕ →</Btn>
        </Fragment>}
        {step===2&&<Fragment>
          <div style={{fontFamily:"monospace",fontSize:10,color:C.muted,letterSpacing:2,marginBottom:16}}>ШАГ 2 / 2</div>
          <Hero style={{marginBottom:8}}>КАКАЯ ТВОЯ ЦЕЛЬ?</Hero>
          <div style={{fontSize:13,color:C.muted,marginBottom:24}}>AI-тренер подстроит советы под неё</div>
          <div style={{display:"flex",flexDirection:"column",gap:10,flex:1}}>
            {goals.map(g=>(
              <div key={g.v} onClick={()=>setGoal(g.v)}
                style={{display:"flex",alignItems:"center",gap:16,padding:"14px 16px",borderRadius:12,
                  border:`1px solid ${goal===g.v?C.accent:C.border}`,
                  background:goal===g.v?"rgba(200,255,0,0.06)":C.card,cursor:"pointer"}}>
                <span style={{fontSize:24}}>{g.icon}</span>
                <span style={{fontSize:15,fontWeight:600,color:goal===g.v?C.accent:C.text}}>{g.label}</span>
                {goal===g.v&&<span style={{marginLeft:"auto",color:C.accent,fontSize:18}}>✓</span>}
              </div>
            ))}
          </div>
          {err&&<div style={{marginTop:12,padding:"10px 14px",background:"rgba(255,68,68,0.1)",border:`1px solid ${C.danger}`,borderRadius:8,color:C.danger,fontSize:13}}>{err}</div>}
          <div style={{display:"flex",gap:10,marginTop:24}}>
            <Btn onClick={()=>setStep(1)} style={{flex:1}}>← НАЗАД</Btn>
            <Btn accent disabled={saving} onClick={finish} style={{flex:2}}>{saving?"ВХОДИМ...":"НАЧАТЬ 🏋️"}</Btn>
          </div>
        </Fragment>}
      </div>
    </div>
  );
}

// ─── MENU ─────────────────────────────────────────────────────────────────────
function MenuScreen({user,onNav,activeWorkout=false}){
  const streak=user?.streak_days||0;
  const [dayData,setDayData]=useState(null);
  const tgId=user?.telegram_id;
  const profileComplete=user?.profile_complete||false;

  useEffect(()=>{
    if(tgId){
      fetch(`${API}/nutrition/${tgId}`).then(r=>r.json()).then(d=>{
        const eaten=Math.round((d.today_totals?.kcal||0));
        fetch(`${API}/sport/${tgId}`).then(r=>r.json()).then(s=>{
          const todayStr=new Date().toISOString().slice(0,10);
          const burned=Math.round((s.sessions||[]).filter(x=>x.session_date&&x.session_date.slice(0,10)===todayStr).reduce((a,x)=>a+(x.calories_burned||0),0));
          setDayData({eaten,burned});
        }).catch(()=>setDayData({eaten,burned:0}));
      }).catch(()=>setDayData({eaten:0,burned:0}));
    }
  },[tgId]);

  const mainActions=[
    {label:t("menu_rest_timer"),icon:"⏱",s:"rest_timer"},
    {label:t("menu_plan"),icon:"📅",s:"plan_workout"},
    {label:t("menu_reminders"),icon:"🔔",s:"reminders"},
    {label:t("menu_nutrition"),icon:"◈",s:"nutrition"},
    {label:"📷 "+t("menu_photo_kbju"),icon:"📷",s:"food_vision"},
    {label:t("menu_checkin"),icon:"✓",s:"checkin"},
    {label:t("menu_measurements"),icon:"○",s:"measurements"},
  ];
  const catalogActions=[
    {label:t("menu_food_guide"),icon:"🥗",s:"food_guide"},
    {label:t("menu_supplements"),icon:"◆",s:"supplements"},
    {label:t("menu_sport"),icon:"⚽",s:"sport_log"},
  ];
  const profileActions=[
    {label:t("menu_goals"),icon:"🎯",s:"goals"},
    {label:t("menu_gamification"),icon:"🏆",s:"gamification"},
    {label:t("menu_referral"),icon:"🎁",s:"referral"},
    {label:t("menu_language"),icon:"🌐",s:"language"},
    {label:t("menu_support"),icon:"?",s:"support"},
  ];

  const calorieGoal=user?.desired_result==="lose_weight"?1600:user?.desired_result==="gain_muscle"?2800:2200;
  const burnGoal=400;

  return <div style={{padding:"16px 16px 100px"}}>
    <div style={{marginBottom:16}}>
      {streak>0&&<div style={{fontFamily:"monospace",fontSize:12,color:C.accent,marginBottom:8}}>🔥 {streak} {streak===1?"ДЕНЬ":streak<5?"ДНЯ":"ДНЕЙ"} ПОДРЯД</div>}
      <Hero>О, ТЫ ВЕРНУЛСЯ{user?.first_name?`, ${user.first_name.split(" ")[0].toUpperCase()}`:""}</Hero>
      {user?.desired_result&&<div style={{color:C.muted,fontSize:13,marginTop:6,fontFamily:"monospace"}}>ЦЕЛЬ · {GOAL_LABELS[user.desired_result]||user.desired_result}</div>}

    </div>

    {/* Шкалы калорий */}
    <Card style={{marginBottom:16,padding:"14px 16px"}}>
      {/* Калории из еды */}
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
          <div style={{fontSize:11,fontFamily:"monospace",color:C.muted}}>🍽 КАЛОРИИ (ЕДА)</div>
          <div style={{fontSize:13,fontWeight:600,color:C.text}}>{dayData?dayData.eaten:"-"} <span style={{fontSize:10,color:C.muted}}>/ {calorieGoal} ккал</span></div>
        </div>
        <div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden"}}>
          <div style={{height:6,borderRadius:3,background:dayData&&dayData.eaten>calorieGoal?"#FF6B6B":C.accent,width:`${dayData?Math.min((dayData.eaten/calorieGoal)*100,100):0}%`,transition:"width 0.6s ease"}}/>
        </div>
      </div>
      {/* Калории потрачено */}
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
          <div style={{fontSize:11,fontFamily:"monospace",color:C.muted}}>🔥 ПОТРАЧЕНО (СПОРТ)</div>
          <div style={{fontSize:13,fontWeight:600,color:C.text}}>{dayData?dayData.burned:"-"} <span style={{fontSize:10,color:C.muted}}>/ {burnGoal} ккал</span></div>
        </div>
        <div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden"}}>
          <div style={{height:6,borderRadius:3,background:"#4CAF50",width:`${dayData?Math.min((dayData.burned/burnGoal)*100,100):0}%`,transition:"width 0.6s ease"}}/>
        </div>
      </div>
    </Card>

    {activeWorkout&&<Card accent style={{marginBottom:8,cursor:"pointer"}} onClick={()=>onNav("active_workout")}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:24}}>▶</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:14,color:C.accent}}>ПРОДОЛЖИТЬ ТРЕНИРОВКУ</div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>Незавершённая тренировка ждёт</div>
        </div>
        <span style={{color:C.accent}}>→</span>
      </div>
    </Card>}
    {!activeWorkout&&<Btn accent full onClick={()=>onNav("active_workout")} style={{marginBottom:16}}>{t("start_workout")}</Btn>}

    <Kicker>{t("section_quick")}</Kicker>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16,marginTop:8}}>
      {mainActions.map(a=><Card key={a.s} onClick={()=>onNav(a.s)}>
        <div style={{fontSize:18,color:C.accent,marginBottom:4}}>{a.icon}</div>
        <div style={{fontSize:13,color:C.text,fontWeight:500}}>{a.label}</div>
      </Card>)}
    </div>

    {user&&<>
      <Kicker>ПРОФИЛЬ</Kicker>
      {!profileComplete&&<Card style={{marginTop:8,marginBottom:8,cursor:"pointer",border:`1px solid ${C.warn}`}} onClick={()=>onNav("profile")}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:20}}>⚠️</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:C.warn}}>Заполните профиль</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Для персонализации тренировок заполните профиль</div>
          </div>
          <span style={{color:C.muted,fontSize:12}}>→</span>
        </div>
      </Card>}
      {profileComplete&&<Card onClick={()=>onNav("profile")} style={{marginTop:8,marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontWeight:600,fontSize:15,color:C.text}}>{user.first_name}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>{user.age} лет · {user.weight} кг · {user.height} см</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,fontFamily:"monospace",color:C.accent}}>{user.fitness_level?.toUpperCase()||"—"}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:2}}>ИЗМЕНИТЬ →</div>
          </div>
        </div>
        <div style={{borderTop:`0.5px solid ${C.border}`,marginTop:10,paddingTop:10,display:"flex",gap:16}}>
          <div><div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>ИМТ</div><Mono>{user.bmi||"—"}</Mono></div>
          <div><div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>AI</div><Mono>{user.ai_requests_today||0}/{user.ai_daily_limit||5}</Mono></div>
          <div><div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>СТАТУС</div><Mono size={11}>{user.rank_name||"🥉 Новичок"}</Mono></div>
        </div>
      </Card>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {profileActions.map(a=><Card key={a.s} onClick={()=>onNav(a.s)}>
          <div style={{fontSize:18,color:C.accent,marginBottom:4}}>{a.icon}</div>
          <div style={{fontSize:13,color:C.text,fontWeight:500}}>{a.label}</div>
        </Card>)}
      </div>
    </>}

    <Kicker>{t("section_catalog")}</Kicker>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16,marginTop:8}}>
      {catalogActions.map(a=><Card key={a.s+"-c"} onClick={()=>onNav(a.s)}>
        <div style={{fontSize:18,color:C.accent,marginBottom:4}}>{a.icon}</div>
        <div style={{fontSize:12,color:C.text,fontWeight:500}}>{a.label}</div>
      </Card>)}
    </div>
  </div>;
}

function UserSupplementsBlock({tgId}){
  const COMMON=[
    "Протеин","Креатин моногидрат","Омега-3","Витамин D3","Магний",
    "BCAA","Цинк","Витамин C","Мультивитамины","Глютамин",
    "Коллаген","Мелатонин","Кофеин","Бета-аланин","Предтреник",
  ];
  const [supps,setSupps]=useState(null);
  const [adding,setAdding]=useState(false);
  const [form,setForm]=useState({name:"",dose:"",timing:""});
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    if(!tgId)return;
    fetch(`${API}/user/${tgId}/supplements`).then(r=>r.json()).then(d=>setSupps(d.supplements||[])).catch(()=>setSupps([]));
  },[]);

  async function add(name,dose="",timing=""){
    setSaving(true);
    try{
      await fetch(`${API}/user/${tgId}/supplements`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({name,dose:dose||null,timing:timing||null,is_custom:!COMMON.includes(name)})});
      const d=await fetch(`${API}/user/${tgId}/supplements`).then(r=>r.json());
      setSupps(d.supplements||[]);
      setAdding(false);setForm({name:"",dose:"",timing:""});
    }catch{}finally{setSaving(false);}
  }

  async function remove(id){
    await fetch(`${API}/user/${tgId}/supplements/${id}`,{method:"DELETE"});
    setSupps(p=>p.filter(s=>s.id!==id));
  }

  const alreadyAdded=new Set((supps||[]).map(s=>s.name));

  return<div style={{marginBottom:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <Kicker>💊 МОИ ДОБАВКИ</Kicker>
      <button onClick={()=>setAdding(!adding)}
        style={{background:"none",border:`0.5px solid ${C.accent}`,borderRadius:6,padding:"3px 10px",
          color:C.accent,fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>
        {adding?"✕":"+ ДОБАВИТЬ"}
      </button>
    </div>
    {supps===null?<Loader text="ЗАГРУЗКА"/>:supps.length===0&&!adding?
      <div style={{color:C.muted,fontSize:12,fontFamily:"monospace",padding:"8px 0"}}>Не указаны</div>:
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:adding?12:0}}>
        {supps.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:6,
          background:C.card,border:`0.5px solid ${C.border}`,borderRadius:20,padding:"5px 10px"}}>
          <span style={{fontSize:12,color:C.text}}>{s.name}</span>
          {s.dose&&<span style={{fontSize:10,color:C.muted}}>{s.dose}</span>}
          <button onClick={()=>remove(s.id)}
            style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:12,padding:0,lineHeight:1}}>✕</button>
        </div>)}
      </div>}
    {adding&&<Card style={{marginTop:8}}>
      <Kicker>БЫСТРЫЙ ВЫБОР</Kicker>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,margin:"8px 0 12px"}}>
        {COMMON.filter(n=>!alreadyAdded.has(n)).map(n=>(
          <button key={n} onClick={()=>add(n)}
            style={{padding:"5px 12px",borderRadius:20,fontSize:12,cursor:"pointer",
              background:C.card,border:`0.5px solid ${C.border}`,color:C.text}}>{n}</button>
        ))}
      </div>
      <Kicker>ИЛИ ВВЕДИ ВРУЧНУЮ</Kicker>
      <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
        placeholder="Название добавки..."
        style={{width:"100%",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
          padding:"8px 12px",color:C.text,fontSize:13,outline:"none",
          boxSizing:"border-box",marginTop:6,marginBottom:6}}/>
      <div style={{display:"flex",gap:6,marginBottom:8}}>
        <input value={form.dose} onChange={e=>setForm(p=>({...p,dose:e.target.value}))}
          placeholder="Дозировка (напр. 5г)"
          style={{flex:1,background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
            padding:"8px 10px",color:C.text,fontSize:12,outline:"none"}}/>
        <input value={form.timing} onChange={e=>setForm(p=>({...p,timing:e.target.value}))}
          placeholder="Время (утром, до трен.)"
          style={{flex:1,background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
            padding:"8px 10px",color:C.text,fontSize:12,outline:"none"}}/>
      </div>
      <Btn accent full onClick={()=>form.name.trim()&&add(form.name.trim(),form.dose,form.timing)} disabled={!form.name.trim()||saving}>
        {saving?"СОХРАНЯЮ...":"✓ ДОБАВИТЬ"}
      </Btn>
    </Card>}
  </div>;
}

function ProfileScreen({user,tgId,onBack,onUserUpdated}){
  const [editing,setEditing]=useState(false);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [form,setForm]=useState({age:"",weight:"",height:"",gender:"male",fitness_level:"beginner",desired_result:"stay_healthy",ai_tone:"",medical_conditions:[],allergies:[]});

  if(!user)return <div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader text="ПРОФИЛЬ"/></div>;

  function startEdit(){
    setForm({age:user.age||"",weight:user.weight||"",height:user.height||"",gender:user.gender||"male",fitness_level:user.fitness_level||"beginner",desired_result:user.desired_result||"stay_healthy",
      medical_conditions:(user.medical_conditions||[]).filter(c=>c!=="none"),
      allergies:(user.allergies||[]).filter(a=>a!=="none"),
      ai_tone:user.ai_tone||"",
    });setEditing(true);
  }
  async function handleSave(){
    setSaving(true);
    try{
      const body={age:parseInt(form.age)||undefined,weight:parseFloat(form.weight)||undefined,height:parseInt(form.height)||undefined,
        gender:form.gender,fitness_level:form.fitness_level,desired_result:form.desired_result,
        ai_tone:form.ai_tone||undefined,
        medical_conditions:form.medical_conditions.length?form.medical_conditions:["none"],
        allergies:form.allergies.length?form.allergies:["none"]};
      const res=await fetch(`${API}/user/${tgId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      if(res.ok){setSaved(true);setEditing(false);onUserUpdated();setTimeout(()=>setSaved(false),3000);}
      else if(res.status===404){alert("Профиль не найден. Сначала пройди регистрацию в боте @GYMASH_bot, затем вернись сюда.");}
      else{alert(`Ошибка сохранения (${res.status}).`);}
    }catch(e){alert("Нет соединения. Проверь интернет.");}finally{setSaving(false);}
  }

  const medNames=(user.medical_conditions||[]).filter(c=>c!=="none").map(c=>MEDICAL_LABELS[c]||c);
  const algNames=(user.allergies||[]).filter(a=>a!=="none").map(a=>ALLERGY_LABELS[a]||a);
  const aiLimit=user.ai_daily_limit||5;
  const rows=[{l:"Возраст",v:user.age?`${user.age} лет`:"—"},{l:"Вес",v:user.weight?`${user.weight} кг`:"—"},{l:"Рост",v:user.height?`${user.height} см`:"—"},{l:"ИМТ",v:user.bmi||"—"},{l:"Уровень",v:LEVEL_LABELS[user.fitness_level]||"—"},{l:"Цель",v:GOAL_LABELS[user.desired_result]||"—"},{l:"Язык",v:(user.lang||"ru").toUpperCase()},{l:"Стиль AI",v:{"bro":"🤙 Бро","mentor":"🧑‍🏫 Наставник","expert":"🎓 Эксперт"}[user.ai_tone]||"🎓 Эксперт"},{l:"AI сегодня",v:`${user.ai_requests_today||0}/${aiLimit}`},{l:"Статус",v:user.rank_name||"🥉 Новичок"},{l:"Баллы",v:`${user.total_points||0} pts`}];

  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/>
    <Kicker>{t("my_profile")}</Kicker>
    <Hero>{user.first_name||"Атлет"}</Hero>
    {user.username&&<div style={{color:C.muted,fontSize:13,marginTop:4,fontFamily:"monospace"}}>@{user.username}</div>}
    <div style={{height:16}}/>
    {saved&&<div style={{background:"#00CC6622",border:`0.5px solid ${C.success}`,borderRadius:10,padding:"10px 14px",marginBottom:12,fontFamily:"monospace",fontSize:12,color:C.success}}>✓ СОХРАНЕНО</div>}
    {!editing?<>
      <Card style={{marginBottom:12}}>
        {rows.map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<rows.length-1?`0.5px solid ${C.border}`:"none"}}>
          <span style={{fontSize:13,color:C.muted,fontFamily:"monospace"}}>{r.l}</span>
          <span style={{fontSize:13,color:C.text,fontWeight:500}}>{r.v}</span>
        </div>)}
      </Card>
      <div style={{marginBottom:12}}>
        <Kicker>МЕД. ПОКАЗАТЕЛИ / ПРОТИВОПОКАЗАНИЯ</Kicker>
        <Card>{medNames.length>0?<div style={{display:"flex",flexWrap:"wrap",gap:6}}>{medNames.map((n,i)=><Tag key={i} color={C.danger}>{n}</Tag>)}</div>:<span style={{fontSize:13,color:C.muted}}>Не указано</span>}</Card>
      </div>
      <div style={{marginBottom:16}}>
        <Kicker>АЛЛЕРГИИ</Kicker>
        <Card>{algNames.length>0?<div style={{display:"flex",flexWrap:"wrap",gap:6}}>{algNames.map((n,i)=><Tag key={i} color={C.warn}>{n}</Tag>)}</div>:<span style={{fontSize:13,color:C.muted}}>Не указано</span>}</Card>
      </div>
      <UserSupplementsBlock tgId={tgId}/>
      <Btn accent full onClick={startEdit}>✏ РЕДАКТИРОВАТЬ ПРОФИЛЬ</Btn>
    </>:<>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
        {[{label:"Возраст (лет)",key:"age",placeholder:"45"},{label:"Вес (кг)",key:"weight",placeholder:"86"},{label:"Рост (см)",key:"height",placeholder:"186"}].map(f=><Card key={f.key}>
          <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{f.label.toUpperCase()}</div>
          <input type="number" value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} style={{background:"none",border:"none",color:C.accent,fontSize:22,fontFamily:"monospace",fontWeight:700,width:"100%",outline:"none"}}/>
        </Card>)}
        <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ПОЛ</div><Sel value={form.gender} onChange={v=>setForm(p=>({...p,gender:v}))} options={[{value:"male",label:"Мужской"},{value:"female",label:"Женский"}]}/></Card>
        <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>УРОВЕНЬ</div><Sel value={form.fitness_level} onChange={v=>setForm(p=>({...p,fitness_level:v}))} options={[{value:"beginner",label:"Новичок"},{value:"intermediate",label:"Средний"},{value:"advanced",label:"Продвинутый"}]}/></Card>
        <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ЦЕЛЬ</div><Sel value={form.desired_result} onChange={v=>setForm(p=>({...p,desired_result:v}))} options={[{value:"lose_weight",label:"Похудение"},{value:"gain_muscle",label:"Набор массы"},{value:"gain_strength",label:"Сила"},{value:"improve_endurance",label:"Выносливость"},{value:"stay_healthy",label:"Здоровье"}]}/></Card>
        <Card style={{marginBottom:12}}>
          <Kicker style={{marginBottom:10}}>СТИЛЬ ОБЩЕНИЯ AI</Kicker>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[
                {v:"bro",    icon:"🤙", label:"Фитнес-бро",  desc:"Молодёжный, сленг, мотивация"},
                {v:"mentor", icon:"🧑‍🏫", label:"Наставник",   desc:"Умеренный, поддержка, советы"},
                {v:"expert", icon:"🎓", label:"Эксперт",     desc:"Профессиональный, термины"},
              ].map(t=>{
                const isSelected = form.ai_tone===t.v || (!form.ai_tone && t.v==="expert");
                return(
                  <div key={t.v} onClick={()=>setForm(p=>({...p,ai_tone:t.v}))}
                    style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:10,
                      border:`1px solid ${isSelected?C.accent:C.border}`,
                      background:isSelected?"rgba(200,255,0,0.08)":"none",cursor:"pointer"}}>
                    <span style={{fontSize:20}}>{t.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:isSelected?C.accent:C.text}}>{t.label}</div>
                      <div style={{fontSize:11,color:C.muted}}>{t.desc}</div>
                    </div>
                    {isSelected&&<span style={{color:C.accent,fontSize:16}}>✓</span>}
                  </div>
                );
              })}
            </div>
        </Card>
        <Card>
          <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:10}}>МЕД. ПОКАЗАТЕЛИ / ПРОТИВОПОКАЗАНИЯ</div>
          <CheckboxGroup options={MEDICAL_OPTIONS} selected={form.medical_conditions} onChange={v=>setForm(p=>({...p,medical_conditions:v}))}/>
          {form.medical_conditions.length===0&&<div style={{fontSize:11,color:C.muted,marginTop:8,fontFamily:"monospace"}}>Нет противопоказаний</div>}
        </Card>
        <Card>
          <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:10}}>АЛЛЕРГИИ</div>
          <CheckboxGroup options={ALLERGY_OPTIONS} selected={form.allergies} onChange={v=>setForm(p=>({...p,allergies:v}))}/>
          {form.allergies.length===0&&<div style={{fontSize:11,color:C.muted,marginTop:8,fontFamily:"monospace"}}>Нет аллергий</div>}
        </Card>
      </div>
      <div style={{display:"flex",gap:10}}>
        <Btn full onClick={()=>setEditing(false)} style={{flex:1}}>ОТМЕНА</Btn>
        <Btn accent full onClick={handleSave} disabled={saving} style={{flex:2}}>{saving?"СОХРАНЯЕМ...":t("save_profile")}</Btn>
      </div>
    </>}
  </div>;
}

// ─── WORKOUT HISTORY ──────────────────────────────────────────────────────────
function SportEditModal({session,tgId,onClose,onSaved,onDeleted}){
  const [duration,setDuration]=useState(String(session.duration_min||60));
  const [intensity,setIntensity]=useState(session.intensity||"medium");
  const [notes,setNotes]=useState(session.notes||"");
  const [score,setScore]=useState(session.score||"");
  const [saving,setSaving]=useState(false);

  async function save(){
    setSaving(true);
    try{
      // Удаляем старую и создаём новую с обновлёнными данными
      await fetch(`${API}/sport/${tgId}/${session.id}`,{method:"DELETE"});
      await fetch(`${API}/sport/${tgId}`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          sport_type:session.sport_type,
          duration_min:parseInt(duration)||session.duration_min,
          intensity,
          notes:notes.trim()||score.trim()?`${score?'Счёт: '+score+'. ':''}${notes}`.trim():null,
          session_date:session.session_date,
        }),
      });
      onSaved();
    }catch{}finally{setSaving(false);}
  }

  async function del(){
    if(!window.confirm("Удалить занятие?"))return;
    setSaving(true);
    try{
      await fetch(`${API}/sport/${tgId}/${session.id}`,{method:"DELETE"});
      onDeleted();
    }catch{}finally{setSaving(false);}
  }

  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",
      zIndex:300,display:"flex",alignItems:"flex-end",padding:"0"}}>
      <div style={{background:C.surface,borderRadius:"16px 16px 0 0",padding:"20px 16px 40px",
        width:"100%",border:`0.5px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:16,color:C.text}}>{session.sport_label}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>✕</button>
        </div>

        <div style={{marginBottom:12}}>
          <Kicker>{t("sport_duration")}</Kicker>
          <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
            {[30,45,60,90,120].map(d=>(
              <button key={d} onClick={()=>setDuration(String(d))}
                style={{padding:"6px 14px",borderRadius:8,fontSize:12,cursor:"pointer",
                  background:duration===String(d)?C.accent:C.card,
                  border:`0.5px solid ${duration===String(d)?C.accent:C.border}`,
                  color:duration===String(d)?C.bg:C.text,fontFamily:"monospace"}}>
                {d}
              </button>
            ))}
            <input type="number" value={duration} onChange={e=>setDuration(e.target.value)}
              style={{width:60,background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
                padding:"6px 8px",color:C.text,fontSize:12,outline:"none",textAlign:"center"}}/>
          </div>
        </div>

        <div style={{marginBottom:12}}>
          <Kicker>{t("sport_intensity")}</Kicker>
          <div style={{display:"flex",gap:8,marginTop:6}}>
            {[{v:"low",l:t("intensity_low")},{v:"medium",l:t("intensity_medium")},{v:"high",l:t("intensity_high")}].map(i=>(
              <button key={i.v} onClick={()=>setIntensity(i.v)}
                style={{flex:1,padding:"8px 4px",borderRadius:8,fontSize:11,cursor:"pointer",
                  background:intensity===i.v?C.accent:C.card,
                  border:`0.5px solid ${intensity===i.v?C.accent:C.border}`,
                  color:intensity===i.v?C.bg:C.text}}>
                {i.l}
              </button>
            ))}
          </div>
        </div>

        <div style={{marginBottom:12}}>
          <Kicker>{t("score_opt")}</Kicker>
          <input value={score} onChange={e=>setScore(e.target.value)}
            placeholder="Например: 3:2 или 21:18"
            style={{width:"100%",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
              padding:"8px 12px",color:C.text,fontSize:13,outline:"none",
              boxSizing:"border-box",marginTop:6}}/>
        </div>

        <div style={{marginBottom:16}}>
          <Kicker>ЗАМЕТКИ</Kicker>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)}
            placeholder="Партнёры, ощущения..."
            style={{width:"100%",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
              padding:"8px 12px",color:C.text,fontSize:13,outline:"none",resize:"none",
              minHeight:50,fontFamily:"inherit",boxSizing:"border-box",marginTop:6}}/>
        </div>

        <div style={{display:"flex",gap:8}}>
          <Btn full onClick={del} disabled={saving} style={{flex:1,color:C.danger,border:`0.5px solid ${C.danger}`}}>УДАЛИТЬ</Btn>
          <Btn accent full onClick={save} disabled={saving} style={{flex:2}}>{saving?"СОХРАНЯЕМ...":t("save_profile")}</Btn>
        </div>
      </div>
    </div>
  );
}


function AddCustomExerciseInline({tgId,muscleGroups,onAdded}){
  const [open,setOpen]=useState(false);
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");
  const [f,setF]=useState({name:"",muscle_group_id:"",sets_recommended:"3",reps_recommended:"12",equipment:"",difficulty:"medium"});

  async function save(){
    if(!f.name.trim()){setErr("Укажите название");return;}
    setSaving(true);setErr("");
    try{
      const res=await fetch(`${API}/custom-exercises/${tgId}`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          name:f.name.trim(),
          muscle_group_id:f.muscle_group_id?parseInt(f.muscle_group_id):null,
          sets_recommended:parseInt(f.sets_recommended)||3,
          reps_recommended:parseInt(f.reps_recommended)||12,
          equipment:f.equipment||null,
          difficulty:f.difficulty,
        }),
      });
      if(!res.ok){setErr("Ошибка сохранения");return;}
      const d=await res.json();
      const mg=muscleGroups?.find(g=>g.id===parseInt(f.muscle_group_id));
      onAdded({
        id:d.id,name:f.name.trim(),muscle_group_id:f.muscle_group_id?parseInt(f.muscle_group_id):null,
        sets_recommended:parseInt(f.sets_recommended)||3,reps_recommended:parseInt(f.reps_recommended)||12,
        equipment:f.equipment||null,difficulty:f.difficulty,is_custom:true,photo_url:null,
        group_name:mg?.name||"Моё",group_emoji:mg?.emoji||"⭐",
      });
      setOpen(false);
      setF({name:"",muscle_group_id:"",sets_recommended:"3",reps_recommended:"12",equipment:"",difficulty:"medium"});
    }catch{setErr("Ошибка сети");}
    finally{setSaving(false);}
  }

  if(!open)return(
    <button onClick={()=>setOpen(true)}
      style={{width:"100%",marginTop:8,marginBottom:4,background:"none",
        border:`0.5px dashed ${C.border}`,borderRadius:10,padding:"10px 16px",
        color:C.muted,fontSize:12,cursor:"pointer",fontFamily:"monospace",letterSpacing:1}}>
      ⭐ ДОБАВИТЬ СВОЁ УПРАЖНЕНИЕ
    </button>
  );

  return(
    <Card style={{marginTop:8,marginBottom:8}}>
      <Kicker>СВОЁ УПРАЖНЕНИЕ</Kicker>
      <input value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}
        placeholder="Название *"
        style={{width:"100%",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
          padding:"8px 12px",color:C.text,fontSize:13,outline:"none",
          marginBottom:8,boxSizing:"border-box",marginTop:8}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
        <select value={f.muscle_group_id} onChange={e=>setF(p=>({...p,muscle_group_id:e.target.value}))}
          style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px 10px",
            color:C.text,fontSize:12,outline:"none"}}>
          <option value="">Группа мышц</option>
          {(muscleGroups||[]).map(g=><option key={g.id} value={g.id}>{g.emoji} {g.name}</option>)}
        </select>
        <select value={f.difficulty} onChange={e=>setF(p=>({...p,difficulty:e.target.value}))}
          style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px 10px",
            color:C.text,fontSize:12,outline:"none"}}>
          <option value="easy">Лёгкое</option>
          <option value="medium">Среднее</option>
          <option value="hard">Сложное</option>
        </select>
        <input type="number" value={f.sets_recommended} onChange={e=>setF(p=>({...p,sets_recommended:e.target.value}))}
          placeholder="Подходов"
          style={{background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
            padding:"8px 10px",color:C.text,fontSize:12,outline:"none",textAlign:"center"}}/>
        <input type="number" value={f.reps_recommended} onChange={e=>setF(p=>({...p,reps_recommended:e.target.value}))}
          placeholder="Повторений"
          style={{background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
            padding:"8px 10px",color:C.text,fontSize:12,outline:"none",textAlign:"center"}}/>
      </div>
      {err&&<div style={{color:C.danger,fontSize:12,fontFamily:"monospace",marginBottom:6}}>{err}</div>}
      <div style={{display:"flex",gap:8}}>
        <Btn full onClick={()=>setOpen(false)} style={{flex:1}}>ОТМЕНА</Btn>
        <Btn accent full onClick={save} disabled={saving||!f.name.trim()} style={{flex:2}}>
          {saving?"СОХРАНЯЕМ...":"ДОБАВИТЬ"}
        </Btn>
      </div>
    </Card>
  );
}


// ── SportEditModal ────────────────────────────────────────────────────────────
function AddExerciseDuringWorkout({allExercises,muscleGroups,tgId,onAdd}){
  const [open,setOpen]=useState(false);
  const [search,setSearch]=useState("");
  const [groupId,setGroupId]=useState(null);

  const filtered=(allExercises||[]).filter(e=>
    (!groupId||e.muscle_group_id===groupId)&&
    (!search||e.name.toLowerCase().includes(search.toLowerCase()))
  ).slice(0,20);

  if(!open)return(
    <button onClick={()=>setOpen(true)}
      style={{width:"100%",marginTop:4,background:"none",border:`0.5px dashed ${C.border}`,
        borderRadius:8,padding:"8px",color:C.muted,fontSize:11,cursor:"pointer",
        fontFamily:"monospace",letterSpacing:1}}>
      + ДОБАВИТЬ УПРАЖНЕНИЕ
    </button>
  );

  return(
    <div style={{marginTop:8,background:C.surface,border:`0.5px solid ${C.border}`,borderRadius:12,padding:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <Kicker>ДОБАВИТЬ УПРАЖНЕНИЕ</Kicker>
        <button onClick={()=>{setOpen(false);setSearch("");setGroupId(null);}}
          style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="Поиск..."
        style={{width:"100%",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
          padding:"8px 12px",color:C.text,fontSize:12,outline:"none",
          boxSizing:"border-box",marginBottom:8}}/>
      <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:4,marginBottom:8}}>
        <button onClick={()=>setGroupId(null)}
          style={{flexShrink:0,padding:"4px 10px",borderRadius:12,fontSize:10,cursor:"pointer",
            background:!groupId?C.accent:C.card,border:`0.5px solid ${!groupId?C.accent:C.border}`,
            color:!groupId?C.bg:C.muted,fontFamily:"monospace"}}>ВСЕ</button>
        {(muscleGroups||[]).map(g=>(
          <button key={g.id} onClick={()=>setGroupId(groupId===g.id?null:g.id)}
            style={{flexShrink:0,padding:"4px 10px",borderRadius:12,fontSize:10,cursor:"pointer",
              background:groupId===g.id?C.accent:C.card,border:`0.5px solid ${groupId===g.id?C.accent:C.border}`,
              color:groupId===g.id?C.bg:C.muted,fontFamily:"monospace"}}>{g.emoji}</button>
        ))}
      </div>
      <div style={{maxHeight:200,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
        {filtered.map(ex=>(
          <button key={ex.id} onClick={()=>{onAdd(ex);setOpen(false);setSearch("");setGroupId(null);}}
            style={{width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,
              padding:"8px 10px",color:C.text,fontSize:12,cursor:"pointer",textAlign:"left",
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontWeight:600}}>{ex.name}</div>
              <div style={{fontSize:10,color:C.muted}}>{ex.group_emoji} {ex.group_name}</div>
            </div>
            <span style={{color:C.accent,fontSize:16,flexShrink:0}}>+</span>
          </button>
        ))}
        {filtered.length===0&&<div style={{textAlign:"center",color:C.muted,fontSize:12,padding:12}}>Ничего не найдено</div>}
      </div>
    </div>
  );
}


// ── AddCustomExerciseInline ───────────────────────────────────────────────────
function PlateauBlock({tgId}){
  const [data,setData]=useState(null);
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    if(!tgId||!open)return;
    fetch(`${API}/plateau/${tgId}`).then(r=>r.json()).then(setData).catch(()=>setData(null));
  },[open]);

  return(
    <Card style={{marginBottom:16}}>
      <button onClick={()=>setOpen(!open)}
        style={{width:"100%",background:"none",border:"none",display:"flex",
          alignItems:"center",justifyContent:"space-between",cursor:"pointer",padding:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>📊</span>
          <Kicker style={{margin:0}}>{t("plateau_title")}</Kicker>
        </div>
        <span style={{color:C.accent,fontSize:14}}>{open?"∧":"∨"}</span>
      </button>
      {open&&<div style={{marginTop:12,paddingTop:12,borderTop:`0.5px solid ${C.border}`}}>
        {!data?<Loader text="АНАЛИЗ"/>:
         !data.has_plateau?(
           <div style={{color:C.success,fontFamily:"monospace",fontSize:12,textAlign:"center",padding:"8px 0"}}>
             ✅ {t("plateau_none")}
           </div>
         ):(
           <div>
             {data.weight_plateau&&<div style={{marginBottom:10}}>
               <div style={{fontSize:12,color:C.warn,fontFamily:"monospace",marginBottom:4}}>
                 ⚠️ {t("plateau_weight")}
               </div>
               <div style={{fontSize:11,color:C.muted}}>
                 Изменение за 3 недели: {data.weight_change > 0 ? "+" : ""}{data.weight_change} кг
               </div>
             </div>}
             {data.stagnant_exercises?.length>0&&<div>
               <div style={{fontSize:12,color:C.warn,fontFamily:"monospace",marginBottom:6}}>
                 ⚠️ {t("plateau_exercise")}:
               </div>
               {data.stagnant_exercises.map((ex,i)=>(
                 <div key={i} style={{padding:"6px 0",borderBottom:`0.5px solid ${C.border}`,fontSize:12}}>
                   <div style={{color:C.text}}>{ex.name}</div>
                   <div style={{color:C.muted,fontSize:11}}>
                     {ex.min_weight}–{ex.max_weight} кг · {ex.sessions} тренировок
                   </div>
                 </div>
               ))}
               <div style={{marginTop:10,fontSize:11,color:C.muted}}>
                 💡 Попробуй сменить упражнение или добавить дроп-сет — спроси тренера
               </div>
             </div>}
           </div>
         )
        }
      </div>}
    </Card>
  );
}

function AddCustomProductForm({onAdded}){
  const CATS=[
    {v:"meat",l:"🥩 Мясо"},{v:"fish",l:"🐟 Рыба"},{v:"dairy",l:"🥛 Молочка"},
    {v:"eggs",l:"🥚 Яйца"},{v:"grains",l:"🌾 Крупы"},{v:"bread",l:"🍞 Хлеб"},
    {v:"vegetables",l:"🥦 Овощи"},{v:"fruits",l:"🍎 Фрукты"},{v:"nuts",l:"🥜 Орехи"},
    {v:"drinks",l:"🧃 Напитки"},{v:"snacks",l:"🍫 Снеки"},{v:"other",l:"🫙 Прочее"},
  ];
  const [open,setOpen]=useState(false);
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");
  const [f,setF]=useState({name:"",calories:"",protein:"",fat:"",carbs:"",fiber:"",category:"meat"});

  async function save(){
    if(!f.name.trim()||!f.calories){setErr("Укажите название и калории");return;}
    setSaving(true);setErr("");
    try{
      const res=await fetch(`${API}/food/products`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          name:f.name.trim(),calories:parseFloat(f.calories)||0,
          protein:parseFloat(f.protein)||0,fat:parseFloat(f.fat)||0,
          carbs:parseFloat(f.carbs)||0,fiber:parseFloat(f.fiber)||0,
          category:f.category,
        }),
      });
      if(res.status===409){setErr("Продукт с таким названием уже существует");return;}
      if(!res.ok){setErr("Ошибка сохранения");return;}
      const d=await res.json();
      onAdded({
        id:d.id,name:f.name.trim(),calories:parseFloat(f.calories)||0,
        protein:parseFloat(f.protein)||0,fat:parseFloat(f.fat)||0,
        carbs:parseFloat(f.carbs)||0,fiber:parseFloat(f.fiber)||0,
        category:f.category,is_custom:true,is_verified:false,
      });
      setOpen(false);
      setF({name:"",calories:"",protein:"",fat:"",carbs:"",fiber:"",category:"meat"});
    }catch{setErr("Ошибка сети");}
    finally{setSaving(false);}
  }

  if(!open)return(
    <button onClick={()=>setOpen(true)}
      style={{width:"100%",marginTop:8,background:"none",border:`0.5px dashed ${C.border}`,
        borderRadius:10,padding:"12px 16px",color:C.muted,fontSize:13,cursor:"pointer",
        fontFamily:"monospace",letterSpacing:1}}>
      ＋ ДОБАВИТЬ СВОЙ ПРОДУКТ
    </button>
  );

  return(
    <Card style={{marginTop:8}}>
      <Kicker>НОВЫЙ ПРОДУКТ (КБЖУ на 100г)</Kicker>
      <input value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}
        placeholder="Название продукта *"
        style={{width:"100%",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
          padding:"10px 12px",color:C.text,fontSize:13,outline:"none",
          marginBottom:8,boxSizing:"border-box"}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
        {[{k:"calories",p:"Ккал *"},{k:"protein",p:"Белки г"},{k:"fat",p:"Жиры г"},{k:"carbs",p:"Углев г"}].map(x=>(
          <input key={x.k} type="number" value={f[x.k]} onChange={e=>setF(p=>({...p,[x.k]:e.target.value}))}
            placeholder={x.p}
            style={{background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
              padding:"8px 10px",color:C.text,fontSize:13,outline:"none",textAlign:"center"}}/>
        ))}
      </div>
      <Sel value={f.category} onChange={v=>setF(p=>({...p,category:v}))} options={CATS.map(c=>({value:c.v,label:c.l}))}/>
      {err&&<div style={{color:C.danger,fontSize:12,fontFamily:"monospace",marginTop:6}}>{err}</div>}
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <Btn full onClick={()=>setOpen(false)} style={{flex:1}}>ОТМЕНА</Btn>
        <Btn accent full onClick={save} disabled={saving||!f.name.trim()||!f.calories} style={{flex:2}}>
          {saving?"СОХРАНЯЕМ...":"ДОБАВИТЬ"}
        </Btn>
      </div>
    </Card>
  );
}


// ── AddExerciseDuringWorkout ──────────────────────────────────────────────────

function WorkoutHistoryScreen({workouts,onNav,tgId,refreshToken=0}){
  const [activeTab,setActiveTab]=useState("planned");
  const [planned,setPlanned]=useState(null);
  const [deleting,setDeleting]=useState(null);
  const [sportSessions,setSportSessions]=useState(null);
  const [editSport,setEditSport]=useState(null);
  const [sportRefresh,setSportRefresh]=useState(0);

  useEffect(()=>{
    setPlanned(null);
    if(tgId)fetch(`${API}/planned/${tgId}`).then(r=>r.json()).then(d=>setPlanned(d)).catch(()=>setPlanned({planned:[],archive:[]}));
    else setPlanned({planned:[],archive:[]});
  },[refreshToken]);

  useEffect(()=>{
    if(activeTab==="planned"&&!planned){
      if(tgId)fetch(`${API}/planned/${tgId}`).then(r=>r.json()).then(d=>setPlanned(d)).catch(()=>setPlanned({planned:[],archive:[]}));
      else setPlanned({planned:[],archive:[]});
    }
    if(activeTab==="sport"){
      setSportSessions(null);
      if(tgId)fetch(`${API}/sport/${tgId}`).then(r=>r.json()).then(d=>setSportSessions(d.sessions||[])).catch(()=>setSportSessions([]));
      else setSportSessions([]);
    }
  },[activeTab,sportRefresh]);

  async function delPlanned(id){
    setDeleting(id);
    try{await fetch(`${API}/planned/${tgId}/${id}`,{method:"DELETE"});setPlanned(null);}
    catch{}finally{setDeleting(null);}
  }

  async function delSport(id){
    setDeleting(id);
    try{await fetch(`${API}/sport/${tgId}/${id}`,{method:"DELETE"});setSportSessions(null);}
    catch{}finally{setDeleting(null);}
  }

  const fmtDt=iso=>{if(!iso)return"—";const d=new Date(new Date(iso).getTime()+5*3600000);return d.toLocaleString("ru",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});};
  const fmtDate=iso=>{if(!iso)return"—";const d=new Date(iso+"T12:00:00");return d.toLocaleDateString("ru",{day:"numeric",month:"short"});};
  const statusColor={scheduled:C.accent,reminded:C.warn,completed:C.success,missed:C.danger};
  const intensityLabel={low:"Низкая",medium:"Средняя",high:"Высокая"};
  const intensityColor={low:C.success,medium:C.accent,high:C.danger};

  if(!workouts)return <div style={{padding:"16px 16px 100px"}}><Loader text="ТРЕНИРОВКИ"/></div>;

  return <div style={{padding:"16px 16px 100px"}}>
    <Hero>{t("workouts_title")}</Hero>
    <div style={{height:12}}/>
    <div style={{display:"flex",gap:0,marginBottom:16,border:`0.5px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
      {[{id:"planned",label:t("planned_tab")},{id:"sport",label:t("sport_tab")},{id:"history",label:t("archive_tab")}].map(t=>(
        <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{flex:1,padding:"10px 4px",background:activeTab===t.id?C.accent:C.card,border:"none",color:activeTab===t.id?C.bg:C.muted,fontFamily:"monospace",fontSize:10,fontWeight:700,cursor:"pointer",letterSpacing:0.5}}>
          {t.label}
        </button>
      ))}
    </div>
    {localStorage.getItem("gymbot_active_workout")&&<Card accent style={{marginBottom:8,cursor:"pointer"}} onClick={()=>onNav("active_workout")}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:24}}>▶</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:14,color:C.accent}}>ПРОДОЛЖИТЬ ТРЕНИРОВКУ</div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>Незавершённая тренировка ждёт</div>
        </div>
        <span style={{color:C.accent}}>→</span>
      </div>
    </Card>}
    {activeTab!=="sport"&&!localStorage.getItem("gymbot_active_workout")&&<Btn accent full onClick={()=>onNav("active_workout")} style={{marginBottom:16}}>{t("start_workout")}</Btn>}

    {activeTab==="history"&&(
      workouts.length===0
        ?<Card><div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:32,marginBottom:8}}>◎</div><div style={{color:C.muted}}>{t("no_workouts_yet")}</div></div></Card>
        :<div style={{display:"flex",flexDirection:"column",gap:10}}>
          {workouts.map(w=><Card key={w.id} onClick={()=>onNav("workout_detail",{workoutId:w.id})}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <Kicker>{new Date(w.date||w.started_at).toLocaleDateString("ru",{day:"numeric",month:"short"})}</Kicker>
                <div style={{fontWeight:600,fontSize:15,color:C.text}}>{w.workout_type==="completed"?"Тренировка":w.workout_type||"Тренировка"}</div>
              </div>
              <div style={{textAlign:"right"}}><Mono>{w.sets_count||0}</Mono><span style={{fontSize:11,color:C.muted}}> подх</span></div>
            </div>
            <div style={{borderTop:`0.5px solid ${C.border}`,marginTop:10,paddingTop:10,display:"flex",gap:20}}>
              <div><div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>ТОННАЖ</div><Mono>{Math.round((w.total_volume||0)/1000*10)/10}</Mono><span style={{fontSize:11,color:C.muted}}> т</span></div>
              <div><div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>СТАТУС</div><span style={{fontSize:12,fontFamily:"monospace",color:w.status==="finished"?C.success:C.muted}}>{w.status==="finished"?"✓ ЗАВЕРШЕНА":w.status||"—"}</span></div>
            </div>
            <div style={{marginTop:8,fontSize:11,color:C.accent,fontFamily:"monospace"}}>ОТКРЫТЬ СОСТАВ →</div>
          </Card>)}
        </div>
    )}

    {activeTab==="sport"&&(
      <Fragment>
        <Btn accent full onClick={()=>onNav("sport_log",{})} style={{marginBottom:12}}>⚽ ЗАПИСАТЬ ЗАНЯТИЕ</Btn>
        {!sportSessions?<Loader text="СПОРТ"/>:
         sportSessions.length===0?<Card><div style={{textAlign:"center",padding:"20px 0",color:C.muted}}>{t("no_sport_yet")}</div></Card>:
         <div style={{display:"flex",flexDirection:"column",gap:8}}>
           {(()=>{const today=new Date().toISOString().split("T")[0];
             const future=sportSessions.filter(s=>s.session_date>=today);
             const past=sportSessions.filter(s=>s.session_date<today);
             return(<>
             {future.map(s=>(
              <Card key={s.id} onClick={()=>setEditSport(s)} style={{cursor:"pointer",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:15,color:C.text}}>{s.sport_label}</div>
                    <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginTop:2}}>{fmtDate(s.session_date)}</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:10,color:C.accent,fontFamily:"monospace"}}>ИЗМЕНИТЬ →</span>
                    <button onClick={e=>{e.stopPropagation();delSport(s.id);}} disabled={deleting===s.id}
                      style={{background:"none",border:`0.5px solid ${C.danger}`,borderRadius:6,padding:"3px 8px",color:C.danger,fontSize:11,cursor:"pointer",flexShrink:0}}>
                      {deleting===s.id?"...":"✕"}
                    </button>
                  </div>
                </div>
                <div style={{borderTop:`0.5px solid ${C.border}`,marginTop:8,paddingTop:8,display:"flex",gap:16,flexWrap:"wrap"}}>
                  <div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>ВРЕМЯ</div><Mono size={13}>{s.duration_min} мин</Mono></div>
                  <div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>{t("sport_intensity")}</div><span style={{fontSize:12,fontFamily:"monospace",color:intensityColor[s.intensity]||C.muted}}>{intensityLabel[s.intensity]||s.intensity}</span></div>
                  {s.calories_burned>0&&<div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>КАЛОРИИ</div><Mono size={13}>{s.calories_burned} ккал</Mono></div>}
                  {s.score&&<div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>СЧЁТ</div><Mono size={13}>{s.score}</Mono></div>}
                </div>
                {s.notes&&<div style={{fontSize:12,color:C.muted,marginTop:6}}>{s.notes}</div>}
              </Card>
             ))}
             {past.length>0&&<>
               <div style={{marginTop:12,marginBottom:6}}><Kicker>АРХИВ</Kicker></div>
               {past.map(s=>(<Card key={s.id} style={{opacity:0.6,cursor:"pointer",marginBottom:8}} onClick={()=>setEditSport(s)}>
                 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                   <div><div style={{fontWeight:600,fontSize:13,color:C.muted}}>{s.sport_label}</div>
                     <div style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>{fmtDate(s.session_date)}</div></div>
                   <Mono size={12} color={C.muted}>{s.duration_min} мин</Mono>
                 </div></Card>))}
             </>}
             </>);})()} 
          </div>
        }
      {editSport&&<SportEditModal
        session={editSport}
        tgId={tgId}
        onClose={()=>setEditSport(null)}
        onSaved={()=>{setEditSport(null);setSportRefresh(r=>r+1);}}
        onDeleted={()=>{setEditSport(null);setSportRefresh(r=>r+1);}}
      />}
      </Fragment>
    )}

    {activeTab==="planned"&&(
      !planned?<Loader text="ПЛАН"/>:<>
        {(planned.planned||[]).filter(pw=>pw.status==="scheduled"||pw.status==="reminded").length===0&&<Card style={{marginBottom:12}}><div style={{textAlign:"center",padding:"12px 0",color:C.muted,fontSize:14}}>{t("no_planned")}</div></Card>}
        {(planned.planned||[]).filter(pw=>pw.status==="scheduled"||pw.status==="reminded").map(pw=><Card key={pw.id} style={{marginBottom:8}} onClick={()=>onNav("planned_detail",{pwId:pw.id})}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:14,color:C.text}}>{pw.title}</div>
              <div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginTop:3}}>{fmtDt(pw.planned_datetime)}</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:11,fontFamily:"monospace",color:statusColor[pw.status]||C.muted}}>{pw.status?.toUpperCase()}</span>
              <button onClick={e=>{e.stopPropagation();delPlanned(pw.id);}} disabled={deleting===pw.id} style={{background:"none",border:`0.5px solid ${C.danger}`,borderRadius:6,padding:"3px 8px",color:C.danger,fontSize:11,cursor:"pointer"}}>{deleting===pw.id?"...":"✗"}</button>
            </div>
          </div>
          <div style={{marginTop:8,fontSize:11,color:C.accent,fontFamily:"monospace"}}>ОТКРЫТЬ СОСТАВ →</div>
        </Card>)}
        <Btn full onClick={()=>onNav("plan_workout")} style={{marginTop:8}}>+ ЗАПЛАНИРОВАТЬ ТРЕНИРОВКУ</Btn>
        {planned.archive?.length>0&&<>
          <div style={{marginTop:20,marginBottom:8}}><Kicker>{t("planned_archive")}</Kicker></div>
          {planned.archive.map(pw=><Card key={pw.id} style={{marginBottom:8,opacity:0.6}} onClick={()=>onNav("planned_detail",{pwId:pw.id,readOnly:true})}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <div><div style={{fontWeight:600,fontSize:14,color:C.muted}}>{pw.title}</div><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginTop:2}}>{fmtDt(pw.planned_datetime)}</div></div>
              <span style={{fontSize:11,fontFamily:"monospace",color:statusColor[pw.status]||C.muted}}>{pw.status?.toUpperCase()}</span>
            </div>
          </Card>)}
        </>}
      </>
    )}
  </div>;
}

// ─── WORKOUT DETAIL ───────────────────────────────────────────────────────────
function WorkoutDetailScreen({workoutId,tgId,onBack}){
  const [data,setData]=useState(null);
  useEffect(()=>{
    if(!workoutId||!tgId){setData({exercises:[],status:"error",_nodata:true});return;}
    fetch(`${API}/workout/${workoutId}?tg_id=${tgId}`)
      .then(r=>{if(!r.ok)throw new Error(r.status);return r.json();})
      .then(setData)
      .catch(()=>setData({exercises:[],status:"error",_nodata:true}));
  },[workoutId]);

  if(!data)return <div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader text="ЗАГРУЗКА"/></div>;
  if(data._nodata)return(
  <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/>
    <Kicker>ОШИБКА</Kicker>
    <Hero style={{fontSize:20}}>НЕ УДАЛОСЬ ЗАГРУЗИТЬ</Hero>
    <div style={{height:16}}/>
    <Card danger>
      <div style={{fontSize:13,color:C.danger,fontFamily:"monospace",lineHeight:1.6}}>
        Тренировка не найдена или нет доступа.<br/>
        Попробуй открыть через Telegram-бот.
      </div>
    </Card>
    <Btn full onClick={onBack} style={{marginTop:16}}>← НАЗАД</Btn>
  </div>
);

  // Тренировка в процессе (active) — показываем что есть
  const isActive = data.status === "active";
  const totalSets=data.exercises?.reduce((s,e)=>s+e.sets.length,0)||0;
  const dateStr=data.date?new Date(data.date).toLocaleDateString("ru",{day:"numeric",month:"long",year:"numeric"}):"—";

  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/>
    <Kicker>{dateStr}</Kicker>
    <Hero>{t("workout_sets")}</Hero>
    <div style={{height:12}}/>
    {isActive&&<div style={{background:"#FFB80022",border:`0.5px solid ${C.warn}`,borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:12,color:C.warn,fontFamily:"monospace"}}>⚠️ ТРЕНИРОВКА ЕЩЁ ВЫПОЛНЯЕТСЯ</div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
      {[{l:"ПОДХОДОВ",v:totalSets},{l:"ТОННАЖ",v:`${Math.round((data.total_volume||0)/1000*10)/10} т`},{l:"СТАТУС",v:data.status==="finished"?"✓":data.status||"—"}].map((s,i)=><Card key={i} style={{textAlign:"center"}}><div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:4}}>{s.l}</div><Mono size={14}>{s.v}</Mono></Card>)}
    </div>

    {data.exercises?.length===0&&<Card><div style={{textAlign:"center",padding:"16px 0",color:C.muted}}>{t("no_sets")}</div></Card>}

    {data.exercises?.map((ex,i)=><Card key={i} style={{marginBottom:10}}>
      <div style={{fontWeight:700,fontSize:15,color:C.text,marginBottom:10}}>{i+1}. {ex.name}</div>
      <div style={{display:"grid",gridTemplateColumns:"auto 1fr 1fr 1fr",gap:"4px 12px",alignItems:"center"}}>
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>ПХ</div>
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>ВЕС</div>
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>ПОВТ</div>
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>RPE</div>
        {ex.sets.map((s,si)=>(
          <Fragment key={`set-${si}`}>
            <Mono size={13}>{s.set_number}</Mono>
            <Mono size={13}>{s.weight!=null?`${s.weight} кг`:"—"}</Mono>
            <Mono size={13}>{s.reps!=null?`${s.reps}`:"—"}</Mono>
            <Mono size={13} color={C.muted}>{s.rpe||"—"}</Mono>
          </Fragment>
        ))}
      </div>
    </Card>)}
    {data?.ai_review&&<Card accent style={{marginTop:12}}>
      <Kicker>💬 СОВЕТ ТРЕНЕРА</Kicker>
      <div style={{fontSize:13,color:C.text,lineHeight:1.6,marginTop:8,whiteSpace:"pre-wrap"}}>{data.ai_review}</div>
    </Card>}
  </div>;
}

// ─── ACTIVE WORKOUT ───────────────────────────────────────────────────────────
function ActiveWorkoutScreen({tgId,exercises,muscleGroups,onBack,onFinish,onFinishNav=null,onNav=null,preselectedExIds=[],plannedWorkoutId=null}){
  const STEP={MD:-1,SG:0,SE:1,WU:2,OR:3,LG:4,FN:5}; // MD=выбор режима
  // Если все упражнения кардио — пропускаем разминку
  const _allCardio=preselectedExIds?.length>0&&exercises?.length>0&&
    preselectedExIds.every(id=>{const ex=exercises?.find(e=>e.id===id);return ex?.muscle_group_id===9;});
  const initStep=preselectedExIds?.length>0?(_allCardio?3:2):-1;
  // Восстанавливаем сохранённое состояние тренировки
  const _saved=()=>{try{const s=localStorage.getItem("gymbot_active_workout");return s?JSON.parse(s):null;}catch{return null;}};
  const _sv=_saved();
  const [step,setStep]=useState(_sv?.step??initStep);
  const [selGroups,setSelGroups]=useState(new Set()); // мультивыбор групп
  const [selExs,setSelExs]=useState(_sv?.selExs||[]);
  const [warmup,setWarmup]=useState(_sv?.warmup||null);
  const [warmupDone,setWarmupDone]=useState(_sv?.warmupDone||false);
  const [workoutId,setWorkoutId]=useState(_sv?.workoutId||null);
  const [curIdx,setCurIdx]=useState(_sv?.curIdx||0);
  const [sets,setSets]=useState(_sv?.sets||{});
  const [startTime]=useState(_sv?.startTime||Date.now());
  const [resumeBanner,setResumeBanner]=useState(!!_sv&&(_sv.workoutId||_sv.selExs?.length>0));
  const [exSearch,setExSearch]=useState("");
  const [replaceIdx,setReplaceIdx]=useState(null);
  const [localSet,setLocalSet]=useState({reps:"",weight:"",time:"",distance:""});
  const [logBusy,setLogBusy]=useState(false); // B-04: блокировка двойного нажатия
  const [lgReplaceMode,setLgReplaceMode]=useState(false); // B-07: замена упражнения
  const [aiReview,setAiReview]=useState(null); // B-06: AI оценка (null=загрузка, ""=ошибка)
  const [showTimer,setShowTimer]=useState(false);

  // Автосохранение состояния тренировки при любом изменении
  useEffect(()=>{
    if(step===STEP.FN){
      // Тренировка завершена — очищаем
      try{localStorage.removeItem("gymbot_active_workout");}catch{}
      return;
    }
    if(workoutId||selExs.length>0){
      // Сохраняем при наличии workoutId или выбранных упражнений
      try{
        localStorage.setItem("gymbot_active_workout",JSON.stringify({
          step,selExs,warmup,warmupDone,workoutId,curIdx,sets,startTime,
          plannedWorkoutId,savedAt:Date.now(),
        }));
      }catch{}
    }
  },[step,curIdx,sets,workoutId,selExs.length]);
  // Спорт режим
  const [sports,setSports]=useState([]);
  useEffect(()=>{
    fetch(`${API}/sport-types`).then(r=>r.json()).then(d=>{
      if(d.sport_types?.length)setSports(d.sport_types);
    }).catch(()=>{});
  },[]);

  const allEx=exercises||[];
  const [customExs,setCustomExs]=useState([]);
  useEffect(()=>{
    if(tgId)fetch(`${API}/custom-exercises/${tgId}`).then(r=>r.json()).then(d=>setCustomExs((d.exercises||[]).map(e=>({...e,group_name:e.group_name||"Моё",group_emoji:e.group_emoji||"⭐"})))).catch(()=>{});
  },[]);
  const allExWithCustom=[...allEx,...customExs.filter(ce=>!allEx.find(e=>e.id===ce.id))];

  // Заполняем selExs из preselectedExIds (запуск из запланированной тренировки)
  useEffect(()=>{
    if(preselectedExIds?.length>0&&allEx.length>0&&selExs.length===0){
      const preEx=preselectedExIds
        .map((id,i)=>{const ex=allEx.find(e=>e.id===id);return ex?{...ex,order:i+1}:null;})
        .filter(Boolean);
      if(preEx.length>0)setSelExs(preEx);
    }
  },[allEx.length]);
  const filteredEx=allExWithCustom.filter(e=>(selGroups.size===0||selGroups.has(e.muscle_group_id))&&(!exSearch||e.name.toLowerCase().includes(exSearch.toLowerCase())));
  const cardioExs=allExWithCustom.filter(e=>e.muscle_group_id===9);

  function toggleEx(ex){setSelExs(p=>{const h=p.find(e=>e.id===ex.id);if(h)return p.filter(e=>e.id!==ex.id);return[...p,{...ex,order:p.length+1}];});}
  function moveEx(i,d){setSelExs(p=>{const a=[...p],t=i+d;if(t<0||t>=a.length)return a;[a[i],a[t]]=[a[t],a[i]];return a.map((e,j)=>({...e,order:j+1}));});}
  function doReplace(i,ex){setSelExs(p=>p.map((e,j)=>j===i?{...ex,order:e.order}:e));setReplaceIdx(null);}
  function stepBack(){if(step===STEP.MD||step===STEP.SG)onBack();else if(step===STEP.SE){setStep(STEP.SG);}else if(step===STEP.WU)setStep(STEP.SE);else if(step===STEP.OR)setStep(STEP.WU);}

  async function startWorkout(){
    try{
      const r=await fetch(`${API}/workout/start/${tgId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({exercise_ids:selExs.map(e=>e.id)})});
      const d=await r.json();setWorkoutId(d.workout_id);
      const init={};selExs.forEach(e=>{init[e.id]=[];});setSets(init);setStep(STEP.LG);
    }catch{alert("Ошибка запуска");}
  }
  async function doLog(){
    const ex=selExs[curIdx];if(!ex||!workoutId)return;
    const done=(sets[ex.id]||[]).length;
    await fetch(`${API}/workout/${workoutId}/set?tg_id=${tgId}`,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({exercise_id:ex.id,exercise_name:ex.name,set_number:done+1,reps:parseInt(localSet.reps)||null,weight:parseFloat(localSet.weight)||null,duration_sec:parseInt(localSet.time)||null,distance_km:parseFloat(localSet.distance)||null})});
    setSets(p=>({...p,[ex.id]:[...(p[ex.id]||[]),{...localSet}]}));
    setLocalSet({reps:"",weight:"",time:"",distance:""});
  }
  async function finish(){
    console.log("[finish] START workoutId:",workoutId,"plannedWorkoutId:",plannedWorkoutId,"tgId:",tgId);
    try{localStorage.removeItem("gymbot_active_workout");}catch{}
    const dur=Math.round((Date.now()-startTime)/60000);
    try{
      if(workoutId){
        const fr=await fetch(`${API}/workout/${workoutId}/finish?tg_id=${tgId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({duration_minutes:dur})});
        console.log("[finish] workout finish →",fr.status);
      }
    }catch(e){console.error("[finish] workout finish error",e);}
    // Помечаем запланированную тренировку как выполненную
    const pwId=plannedWorkoutId;
    console.log("[finish] pwId=",pwId);
    if(pwId&&tgId){
      try{
        const r=await fetch(`${API}/planned/${tgId}/${pwId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"completed"})});
        console.log("[finish] planned PUT",pwId,"→",r.status);
      }catch(e){console.error("[finish] planned PUT error",e);}
    }else{
      console.log("[finish] SKIP planned: pwId=",pwId,"tgId=",tgId);
    }
    if(onFinish)onFinish();
    setStep(STEP.FN);
    // B-06: запрашиваем AI оценку тренировки
    try{
      const totalSetsCount=Object.values(sets).reduce((s,a)=>s+a.length,0);
      const exList=selExs.map((e,i)=>{
        const exSets=sets[e.id]||[];
        const setsStr=exSets.map(s=>s.weight?`${s.weight}кг×${s.reps}`:s.time?`${s.time}с`:"—").join(", ");
        return `${i+1}. ${e.name}: ${setsStr||"нет данных"}`;
      }).join("\n");
      const q=`Оцени мою тренировку. Длительность: ${dur} мин. Упражнений: ${selExs.length}. Подходов: ${totalSetsCount}.

Состав:
${exList}

Дай короткую оценку (3-4 предложения): что хорошо, что улучшить, совет на следующую тренировку.`;
      // Загружаем историю советов для контекста
      let prevReviews="";
      try{
        const rv=await fetch(`${API}/workouts/${tgId}/recent-reviews?limit=3`);
        if(rv.ok){
          const rd=await rv.json();
          if(rd.reviews?.length){
            prevReviews="\n\nПредыдущие советы тренера:\n"+rd.reviews.map(r=>`${r.date}: ${r.review}`).join("\n");
          }
        }
      }catch{}

      const res=await fetch(`${API}/ai/ask`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:q+prevReviews,tg_id:tgId,skip_limit:true})});
      if(res.status===429){setAiReview("__limit__");return;}
      if(!res.ok){setAiReview("__error__");return;}
      const d=await res.json();
      const reviewText=d.answer||"__error__";
      setAiReview(reviewText);
      // Сохраняем совет тренера в БД
      if(workoutId&&reviewText&&reviewText!=="__error__"&&reviewText!=="__limit__"){
        try{
          await fetch(`${API}/workout/${workoutId}/ai-review?tg_id=${tgId}&review=${encodeURIComponent(reviewText)}`,{method:"POST"});
        }catch{}
      }
    }catch{setAiReview("__error__");}
  }

  if(step===STEP.FN)return(
    <div style={{padding:"16px 16px 100px"}}>
      <div style={{textAlign:"center",paddingTop:32,paddingBottom:24}}>
        <div style={{fontSize:60}}>🏆</div>
        <Hero style={{textAlign:"center",marginTop:16}}>{t("workout_done")}</Hero>
        <div style={{color:C.muted,fontSize:14,marginTop:8}}>{t("great_work")}</div>
        <div style={{marginTop:8,fontFamily:"monospace",color:C.accent,fontSize:20}}>{Math.round((Date.now()-startTime)/60000)} МИНУТ</div>
      </div>

      {/* Итоги */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
        {[
          {l:"УПРАЖНЕНИЙ",v:selExs.length},
          {l:"ПОДХОДОВ",v:Object.values(sets).reduce((s,a)=>s+a.length,0)},
          {l:"МИНУТ",v:Math.round((Date.now()-startTime)/60000)},
        ].map((s,i)=><Card key={i} style={{textAlign:"center"}}><div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:4}}>{s.l}</div><Mono size={18}>{s.v}</Mono></Card>)}
      </div>

      {/* B-06: AI оценка тренировки */}
      {aiReview===null?(
        <Card accent style={{marginBottom:16}}>
          <Kicker>AI ТРЕНЕР</Kicker>
          <div style={{textAlign:"center",padding:"12px 0"}}>
            <div style={{color:C.accent,fontFamily:"monospace",fontSize:12,letterSpacing:2}}>{t("analyzing")}</div>
            <div style={{color:C.muted,fontSize:24,marginTop:8}}>◌</div>
          </div>
        </Card>
      ):aiReview&&aiReview!=="__limit__"&&aiReview!=="__error__"?(
        <Card accent style={{marginBottom:16}}>
          <Kicker>ОЦЕНКА AI ТРЕНЕРА</Kicker>
          <div style={{fontSize:14,color:C.text,lineHeight:1.7,marginTop:8,whiteSpace:"pre-wrap"}}>{aiReview}</div>
        </Card>
      ):aiReview==="__limit__"?(
        <Card style={{marginBottom:16}}>
          <div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"8px 0"}}>
            💬 Лимит AI запросов на сегодня исчерпан — оценка будет доступна завтра
          </div>
        </Card>
      ):aiReview==="__error__"?(
        <Card style={{marginBottom:16}}>
          <div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"8px 0"}}>
            Не удалось получить оценку AI — проверь соединение
          </div>
        </Card>
      ):null}

      <Btn accent full onClick={()=>{if(onFinishNav)onFinishNav();else onBack();}} style={{marginTop:8}}>← В МЕНЮ</Btn>
    </div>
  );

  // ── Выбор режима: тренажёрка или спорт ──────────────────────────────────────
  if(step===STEP.MD)return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={onBack}/>
      <Kicker>{t("choose_type_label")}</Kicker>
      <Hero style={{marginBottom:24}}>{t("choose_type")}</Hero>
      {resumeBanner&&<Card accent style={{marginBottom:16,cursor:"pointer"}} onClick={()=>{setResumeBanner(false);setStep(STEP.LG);}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:28}}>▶</span>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:C.accent}}>{t("resume_workout")}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>{t("resume_desc")}</div>
          </div>
          <span style={{marginLeft:"auto",color:C.accent,fontSize:18}}>→</span>
        </div>
      </Card>}
      <Card onClick={()=>setStep(STEP.SG)} style={{marginBottom:12,cursor:"pointer",padding:"20px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <span style={{fontSize:40}}>🏋️</span>
          <div>
            <div style={{fontWeight:700,fontSize:17,color:C.text,marginBottom:4}}>{t("gym_title")}</div>
            <div style={{fontSize:13,color:C.muted}}>{t("gym_desc")}</div>
          </div>
          <span style={{color:C.accent,fontSize:20,marginLeft:"auto"}}>→</span>
        </div>
      </Card>
      <Card style={{cursor:"pointer",padding:"20px 16px"}}>
        <div style={{fontWeight:700,fontSize:17,color:C.text,marginBottom:12}}>
          <span style={{fontSize:24,marginRight:10}}>⚽</span>{t("sport_section_title")}
        </div>
        <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{t("sport_section_desc")}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {(sports.length?sports:[
            {code:"football",name:"⚽ Футбол"},{code:"volleyball",name:"🏐 Волейбол"},
            {code:"basketball",name:"🏀 Баскетбол"},{code:"table_tennis",name:"🏓 Настольный теннис"},
            {code:"padel",name:"🎾 Падел"},{code:"tennis",name:"🎾 Большой теннис"},{code:"yoga",name:"🧘 Йога"},
          ]).map(s=>(
            <button key={s.code||s.v} onClick={()=>{
              if(onNav){onNav("sport_log",{initial_sport:s.code||s.v});}else{onBack();}
            }}
              style={{padding:"8px 14px",borderRadius:20,fontSize:13,cursor:"pointer",
                background:C.card,border:`0.5px solid ${C.border}`,color:C.text}}>
              {s.name}
            </button>
          ))}
        </div>
        <div style={{marginTop:12,fontSize:11,color:C.muted,fontFamily:"monospace"}}>
          ↗ Полная запись в разделе Тренировки → ⚽ Спорт
        </div>
      </Card>
    </div>
  );

  if(step===STEP.SG)return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={()=>setStep(STEP.MD)}/>
      <Kicker>ШАГ 1 / 4</Kicker><Hero>{t("muscles_title")}</Hero>
      <div style={{fontSize:13,color:C.muted,marginTop:8,marginBottom:16}}>{t("select_groups_hint")}</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        {muscleGroups?.map(g=>{
          const sel=selGroups.has(g.id);
          return(
            <Card key={g.id} accent={sel} onClick={()=>{setSelGroups(prev=>{const n=new Set(prev);if(n.has(g.id))n.delete(g.id);else n.add(g.id);return n;}); setExSearch("");}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><span style={{fontSize:22,marginRight:12}}>{g.emoji}</span><span style={{fontSize:15,fontWeight:600,color:sel?C.accent:C.text}}>{g.name}</span></div>
                <span style={{width:22,height:22,borderRadius:6,background:sel?C.accent:C.card,border:`0.5px solid ${sel?C.accent:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:sel?C.bg:C.muted,flexShrink:0}}>{sel?"✓":""}</span>
              </div>
            </Card>
          );
        })}
      </div>
      {selGroups.size>0&&(
        <div style={{marginBottom:12,fontFamily:"monospace",fontSize:11,color:C.accent}}>
          ВЫБРАНО ГРУПП: {selGroups.size} · {(muscleGroups||[]).filter(g=>selGroups.has(g.id)).map(g=>g.emoji+g.name).join(", ")}
        </div>
      )}
      <Btn accent full onClick={()=>setStep(STEP.SE)}>
        {selGroups.size===0?"ПОКАЗАТЬ ВСЕ УПРАЖНЕНИЯ →":`ПОКАЗАТЬ УПРАЖНЕНИЯ (${selGroups.size} групп) →`}
      </Btn>
    </div>
  );

  if(step===STEP.SE){
    if(replaceIdx!==null)return(
      <div style={{padding:"16px 16px 100px"}}>
        <BackBtn onBack={()=>setReplaceIdx(null)}/>
        <Kicker>{t("replace_title")}</Kicker><Hero>ВЫБЕРИ ЗАМЕНУ</Hero><div style={{height:12}}/>
        {filteredEx.slice(0,30).map(ex=><ExCard key={ex.id} ex={ex} badge={DIFF_LABEL[ex.difficulty]} onClick={()=>doReplace(replaceIdx,ex)}/>)}
      </div>
    );
    return(
      <div style={{padding:"16px 16px 100px"}}>
        <BackBtn onBack={stepBack}/>
        <Kicker>ШАГ 2 / 4</Kicker><Hero>УПРАЖНЕНИЯ</Hero>
        <input value={exSearch} onChange={e=>setExSearch(e.target.value)} placeholder="ПОИСК..." style={{width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:13,fontFamily:"monospace",outline:"none",boxSizing:"border-box",marginTop:12,marginBottom:12}}/>
        {selExs.length>0&&(
          <div style={{marginBottom:12}}>
            <Kicker>ВЫБРАНО ({selExs.length})</Kicker>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {selExs.map((e,i)=><Tag key={e.id} color={C.accent}>{i+1}. {e.name.split(" ").slice(0,2).join(" ")}</Tag>)}
            </div>
          </div>
        )}
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{filteredEx.length} УПРАЖНЕНИЙ</div>
        {filteredEx.slice(0,50).map(ex=>{
          const sel=selExs.find(e=>e.id===ex.id);
          return(
            <ExCard key={ex.id} ex={ex} badge={DIFF_LABEL[ex.difficulty]}
              action={
                <button onClick={ev=>{ev.stopPropagation();toggleEx(ex);}} style={{flexShrink:0,width:32,height:32,borderRadius:8,background:sel?C.accent:C.card,border:`0.5px solid ${sel?C.accent:C.border}`,color:sel?C.bg:C.muted,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {sel?`${sel.order}`:"+"}</button>}/>
          );
        })}
        <AddCustomExerciseInline tgId={tgId} muscleGroups={muscleGroups} onAdded={ex=>{
          setCustomExs(p=>[...p,{...ex,group_name:ex.group_name||"Моё",group_emoji:ex.group_emoji||"⭐"}]);
          setSelExs(p=>[...p,{...ex,order:p.length+1,group_name:ex.group_name||"Моё",group_emoji:ex.group_emoji||"⭐"}]);
        }}/>
        {selExs.length>0&&(
          <div style={{position:"sticky",bottom:80,marginTop:12}}>
            <Btn accent full onClick={()=>{
              const allCardio=selExs.every(e=>e.muscle_group_id===9||cardioType(e)!==null);
              setStep(allCardio?STEP.OR:STEP.WU);
            }}>ДАЛЕЕ → {selExs.every(e=>e.muscle_group_id===9||cardioType(e)!==null)?t("order_title"):"РАЗМИНКА"} ({selExs.length})</Btn>
          </div>
        )}
      </div>
    );
  }

  // Пропускаем разминку если все упражнения кардио
  // Все выбранные упражнения кардио?
  const _isCardioEx=(e)=>e?.muscle_group_id===9||e?.exercise_type==="cardio_time"||e?.exercise_type==="cardio_distance";
  const _checkCardio=(exList)=>exList.length>0&&exList.every(e=>_isCardioEx(e));
  const _preselCardio=selExs.length===0&&preselectedExIds.length>0&&exercises?.length>0&&
    preselectedExIds.every(id=>_isCardioEx((exercises||[]).find(e=>e.id===id)));
  const allSelCardio=_checkCardio(selExs)||_preselCardio;
  if(step===STEP.WU&&allSelCardio){
    // Автоматически переходим к ORDER
    if(step===STEP.WU)setTimeout(()=>setStep(STEP.OR),0);
    return null;
  }

  if(step===STEP.WU)return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={stepBack}/>
      <Kicker>ШАГ 3 / 4</Kicker><Hero>{t("warmup_title")}</Hero>
      <div style={{fontSize:13,color:C.muted,marginTop:8,marginBottom:16}}>{t("warmup_hint")}</div>
      <Btn full onClick={()=>setStep(STEP.OR)} style={{marginBottom:12}}>{t("warmup_skip")}</Btn>
      {cardioExs.map(ex=>(
        <ExCard key={ex.id} ex={ex}
          action={
            <button onClick={()=>setWarmup(warmup?.id===ex.id?null:ex)} style={{flexShrink:0,width:32,height:32,borderRadius:8,background:warmup?.id===ex.id?C.accent:C.card,border:`0.5px solid ${warmup?.id===ex.id?C.accent:C.border}`,color:warmup?.id===ex.id?C.bg:C.muted,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {warmup?.id===ex.id?"✓":"+"}
            </button>}/>
      ))}
      <div style={{position:"sticky",bottom:80,marginTop:12}}>
        <Btn accent full onClick={()=>setStep(STEP.OR)}>{warmup?"✓ "+warmup.name.split(" ").slice(0,2).join(" ")+" → "+t("order_title"):t("warmup_skip")}</Btn>
      </div>
    </div>
  );

  if(step===STEP.OR)return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={stepBack}/>
      <Kicker>ШАГ 4 / 4</Kicker><Hero>ПОРЯДОК</Hero>
      <div style={{fontSize:13,color:C.muted,marginTop:8,marginBottom:16}}>{t("order_hint")}</div>
      {warmup&&<Card accent style={{marginBottom:12}}><div style={{fontSize:12,color:C.accent,fontFamily:"monospace",marginBottom:4}}>🏃 РАЗМИНКА</div><div style={{fontWeight:600,color:C.text}}>{warmup.name}</div></Card>}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        {selExs.map((ex,i)=>(
          <Card key={ex.id}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <Mono color={C.accent} size={20}>{i+1}</Mono>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14,color:C.text}}>{ex.name}</div>
                <div style={{fontSize:11,color:C.muted}}>{ex.group_emoji} {ex.group_name}</div>
              </div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <button onClick={()=>setReplaceIdx(i)} style={{background:"none",border:`0.5px solid ${C.border}`,borderRadius:4,color:C.muted,width:28,height:26,cursor:"pointer",fontSize:12}}>↔</button>
                <div style={{display:"flex",flexDirection:"column",gap:2}}>
                  <button onClick={()=>moveEx(i,-1)} disabled={i===0} style={{background:"none",border:`0.5px solid ${C.border}`,borderRadius:3,color:C.muted,width:28,height:22,cursor:"pointer",fontSize:11}}>↑</button>
                  <button onClick={()=>moveEx(i,1)} disabled={i===selExs.length-1} style={{background:"none",border:`0.5px solid ${C.border}`,borderRadius:3,color:C.muted,width:28,height:22,cursor:"pointer",fontSize:11}}>↓</button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Btn accent full onClick={startWorkout}>{t("start_workout")}</Btn>
    </div>
  );

  if(step===STEP.LG){
    // B-03: показываем экран разминки перед основными упражнениями
    if(warmup&&!warmupDone){return(
      <div style={{padding:"16px 16px 100px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <Kicker>🏃 РАЗМИНКА</Kicker>
          <button onClick={finish} style={{background:"none",border:`0.5px solid ${C.danger}`,borderRadius:8,padding:"5px 10px",color:C.danger,fontSize:11,fontFamily:"monospace",cursor:"pointer"}}>{t("finish_workout")}</button>
        </div>
        {warmup.photo_url&&<img src={warmup.photo_url} alt="" style={{width:"100%",borderRadius:12,marginBottom:12,maxHeight:180,objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>}
        <Hero style={{fontSize:20,marginBottom:4}}>{warmup.name}</Hero>
        <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Выполни разминку перед основной тренировкой</div>
        <Card accent style={{marginBottom:16,padding:"16px",textAlign:"center"}}>
          <div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginBottom:8}}>РЕКОМЕНДУЕМОЕ ВРЕМЯ РАЗМИНКИ</div>
          <div style={{fontSize:32,fontFamily:"monospace",fontWeight:700,color:C.accent}}>5–10 мин</div>
        </Card>
        <Btn accent full onClick={()=>setWarmupDone(true)} style={{marginBottom:10}}>✓ РАЗМИНКА ВЫПОЛНЕНА</Btn>
        <Btn full onClick={()=>setWarmupDone(true)}>ПРОПУСТИТЬ РАЗМИНКУ</Btn>
      </div>
    );}

    const ex=selExs[curIdx];if(!ex)return null;
    const cType=cardioType(ex);
    const doneSets=sets[ex.id]||[];
    const setNum=doneSets.length+1;
    const totalSets=parseInt(ex.sets_recommended)||4;

    // Подсказка следующего веса (+2.5 кг от последнего подхода)
    const lastWeight=doneSets.length>0?parseFloat(doneSets[doneSets.length-1].weight||0):parseFloat(localSet.weight||0);
    const suggestWeight=lastWeight>0?Math.round((lastWeight+2.5)*4)/4:null;

    return(
      <div style={{padding:"16px 16px 100px"}}>
        {/* Хедер */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>
            {ex.group_emoji} {ex.group_name?.toUpperCase()}
          </div>
          <button onClick={finish} style={{background:"none",border:`0.5px solid ${C.danger}`,borderRadius:8,padding:"5px 10px",color:C.danger,fontSize:11,fontFamily:"monospace",cursor:"pointer"}}>
            ЗАВЕРШИТЬ
          </button>
        </div>

        {/* B-07: Название + кнопка замены */}
        {lgReplaceMode?(
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <Kicker>↔ ЗАМЕНА УПРАЖНЕНИЯ</Kicker>
              <button onClick={()=>setLgReplaceMode(false)} style={{background:"none",border:`0.5px solid ${C.border}`,borderRadius:8,padding:"4px 10px",color:C.muted,fontSize:12,cursor:"pointer"}}>ОТМЕНА</button>
            </div>
            <div style={{fontSize:12,color:C.muted,marginBottom:10}}>{ex.group_emoji} {ex.group_name} — выбери замену:</div>
            {(exercises||[]).filter(e=>e.muscle_group_id===ex.muscle_group_id&&e.id!==ex.id).slice(0,15).map(alt=>(
              <ExCard key={alt.id} ex={alt} badge={DIFF_LABEL[alt.difficulty]}
                onClick={()=>{
                  setSelExs(prev=>prev.map((e2,i)=>i===curIdx?{...alt,order:e2.order}:e2));
                  setSets(prev=>{const n={...prev};if(!n[alt.id])n[alt.id]=[];return n;});
                  setLgReplaceMode(false);
                }}
                action={
                  <button
                    onClick={ev=>{ev.stopPropagation();
                      setSelExs(prev=>prev.map((e2,i)=>i===curIdx?{...alt,order:e2.order}:e2));
                      setSets(prev=>{const n={...prev};if(!n[alt.id])n[alt.id]=[];return n;});
                      setLgReplaceMode(false);
                    }}
                    style={{flexShrink:0,background:C.accent,border:"none",borderRadius:8,
                      padding:"6px 10px",color:C.bg,fontSize:11,fontWeight:700,cursor:"pointer"}}>
                    ЗАМЕНИТЬ
                  </button>
                }
              />
            ))}
          </div>
        ):(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <Hero style={{fontSize:22,flex:1}}>{ex.name}</Hero>
              <button onClick={()=>setLgReplaceMode(true)} style={{background:"rgba(200,255,0,0.15)",border:`0.5px solid ${C.accent}`,borderRadius:8,padding:"6px 12px",color:C.accent,fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0,marginLeft:8,fontFamily:"monospace"}}>↔ ЗАМЕНИТЬ</button>
            </div>
            <div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginBottom:12}}>
              ПОДХОД {setNum} / {totalSets}
              {doneSets.length>0&&<span style={{color:C.success,marginLeft:8}}>✓ {doneSets.length} выполнено</span>}
            </div>
          </>
        )}

        {/* Основной блок ввода — скрываем при режиме замены */}
        {!lgReplaceMode&&cType===null&&(
          <Card accent style={{marginBottom:12,padding:"16px"}}>
            <div style={{display:"flex",gap:16,alignItems:"flex-end",justifyContent:"center"}}>

              {/* Вес */}
              <div style={{textAlign:"center",flex:1}}>
                <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("weight_kg")}</div>
                <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
                  <button onClick={()=>setLocalSet(p=>({...p,weight:String(Math.max(0,parseFloat(p.weight||0)-2.5))}))}
                    style={{width:36,height:36,borderRadius:8,background:C.card,border:`0.5px solid ${C.border}`,color:C.muted,fontSize:16,cursor:"pointer",flexShrink:0}}>−</button>
                  <input type="number" value={localSet.weight} onChange={e=>setLocalSet(p=>({...p,weight:e.target.value}))} placeholder="0"
                    style={{background:"none",border:"none",color:C.accent,fontSize:32,fontFamily:"monospace",fontWeight:700,width:80,outline:"none",textAlign:"center"}}/>
                  <button onClick={()=>setLocalSet(p=>({...p,weight:String(parseFloat(p.weight||0)+2.5)}))}
                    style={{width:36,height:36,borderRadius:8,background:C.card,border:`0.5px solid ${C.border}`,color:C.muted,fontSize:16,cursor:"pointer",flexShrink:0}}>+</button>
                </div>
                {suggestWeight&&doneSets.length===0&&(
                  <div style={{fontSize:11,color:C.muted,marginTop:4,fontFamily:"monospace"}}>
                    <button onClick={()=>setLocalSet(p=>({...p,weight:String(suggestWeight)}))}
                      style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:11,fontFamily:"monospace",textDecoration:"underline"}}>
                      → {suggestWeight} кг
                    </button>
                  </div>
                )}
              </div>

              <div style={{width:1,height:60,background:C.border,flexShrink:0}}/>

              {/* Повторения */}
              <div style={{textAlign:"center",flex:1}}>
                <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("reps_label")}</div>
                <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
                  <button onClick={()=>setLocalSet(p=>({...p,reps:String(Math.max(1,parseInt(p.reps||0)-1))}))}
                    style={{width:36,height:36,borderRadius:8,background:C.card,border:`0.5px solid ${C.border}`,color:C.muted,fontSize:16,cursor:"pointer",flexShrink:0}}>−</button>
                  <input type="number" value={localSet.reps} onChange={e=>setLocalSet(p=>({...p,reps:e.target.value}))} placeholder="0"
                    style={{background:"none",border:"none",color:C.accent,fontSize:32,fontFamily:"monospace",fontWeight:700,width:60,outline:"none",textAlign:"center"}}/>
                  <button onClick={()=>setLocalSet(p=>({...p,reps:String(parseInt(p.reps||0)+1)}))}
                    style={{width:36,height:36,borderRadius:8,background:C.card,border:`0.5px solid ${C.border}`,color:C.muted,fontSize:16,cursor:"pointer",flexShrink:0}}>+</button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Кардио: время */}
        {!lgReplaceMode&&cType==="time"&&(
          <Card accent style={{marginBottom:12,padding:"16px",textAlign:"center"}}>
            <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("time_sec")}</div>
            <input type="number" value={localSet.time} onChange={e=>setLocalSet(p=>({...p,time:e.target.value}))} placeholder="0"
              style={{background:"none",border:"none",color:C.accent,fontSize:40,fontFamily:"monospace",fontWeight:700,width:"100%",outline:"none",textAlign:"center"}}/>
          </Card>
        )}

        {/* Кардио: дистанция */}
        {!lgReplaceMode&&cType==="distance"&&(
          <Card accent style={{marginBottom:12,padding:"16px"}}>
            <div style={{display:"flex",gap:16}}>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ВРЕМЯ (МИН)</div>
                <input type="number" value={localSet.time} onChange={e=>setLocalSet(p=>({...p,time:e.target.value}))} placeholder="0"
                  style={{background:"none",border:"none",color:C.accent,fontSize:32,fontFamily:"monospace",fontWeight:700,width:"100%",outline:"none",textAlign:"center"}}/>
              </div>
              <div style={{width:1,background:C.border}}/>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ДИСТ. (КМ)</div>
                <input type="number" step="0.1" value={localSet.distance} onChange={e=>setLocalSet(p=>({...p,distance:e.target.value}))} placeholder="0"
                  style={{background:"none",border:"none",color:C.accent,fontSize:32,fontFamily:"monospace",fontWeight:700,width:"100%",outline:"none",textAlign:"center"}}/>
              </div>
            </div>
          </Card>
        )}

        {/* История подходов */}
        {doneSets.length>0&&(
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            {doneSets.map((s,i)=>(
              <div key={i} style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"6px 10px",textAlign:"center",minWidth:60}}>
                <div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>ПХ {i+1}</div>
                <div style={{fontSize:12,color:C.success,fontFamily:"monospace",fontWeight:700,marginTop:2}}>
                  {cType==="distance"?`${s.distance}км`:cType==="time"?`${s.time}с`:`${s.weight}×${s.reps}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Главная кнопка */}
        <button onClick={async()=>{
          if(logBusy)return;
          setLogBusy(true);
          try{
            await doLog();
            setShowTimer(true);
            setLocalSet({reps:"",weight:"",time:"",distance:""});
          }finally{setLogBusy(false);}
        }}
          disabled={logBusy}
          style={{width:"100%",background:logBusy?"#8FB300":C.accent,border:"none",borderRadius:12,padding:"16px",color:C.bg,fontWeight:700,fontSize:16,cursor:logBusy?"not-allowed":"pointer",marginBottom:10,letterSpacing:0.5,opacity:logBusy?0.8:1,transition:"all 0.15s"}}>
          {logBusy?"⏳ СОХРАНЯЕМ...":"✓ ПОДХОД ВЫПОЛНЕН"}
        </button>

        {/* Навигация между упражнениями */}
        <div style={{display:"flex",gap:10,marginBottom:10}}>
          <Btn full onClick={()=>setCurIdx(i=>Math.max(0,i-1))} disabled={curIdx===0} style={{flex:1}}>{t("prev_btn")}</Btn>
          <Btn full onClick={()=>setCurIdx(i=>Math.min(selExs.length-1,i+1))} disabled={curIdx===selExs.length-1} style={{flex:1}}>{t("next_btn")}</Btn>
        </div>
        {/* Добавить упражнение во время тренировки */}
        <AddExerciseDuringWorkout allEx={allExWithCustom} selExs={selExs} onAdd={ex=>{
          setSelExs(p=>[...p,{...ex,order:p.length+1}]);
          setSets(p=>({...p,[ex.id]:p[ex.id]||[]}));
          setCurIdx(selExs.length);
        }}/>

        {/* Точки-индикаторы */}
        <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",marginBottom:8}}>
          {selExs.map((e,i)=>(
            <button key={e.id} onClick={()=>setCurIdx(i)}
              style={{width:28,height:28,borderRadius:8,background:i===curIdx?C.accent:C.card,border:`0.5px solid ${i===curIdx?C.accent:C.border}`,color:i===curIdx?C.bg:C.muted,fontSize:11,fontFamily:"monospace",cursor:"pointer"}}>
              {i+1}
            </button>
          ))}
        </div>

        {/* Добавить упражнение во время тренировки */}
        <AddExerciseDuringWorkout
          allExercises={allExWithCustom}
          muscleGroups={muscleGroups}
          tgId={tgId}
          onAdd={ex=>{
            if(!selExs.find(e=>e.id===ex.id)){
              setSelExs(p=>[...p,{...ex,order:p.length+1}]);
              setSets(p=>({...p,[ex.id]:[]}));
            }
            setCurIdx(selExs.length);
          }}
        />

        {/* Таймер отдыха */}
        {showTimer&&<RestTimer onClose={()=>setShowTimer(false)}/>}
      </div>
    );
  }
  return null;
}


// ─── MY WORKOUTS DETAIL ───────────────────────────────────────────────────────
function MyWorkoutsDetailScreen({tgId,onBack,onNav}){
  const [data,setData]=useState(null);
  const [deleting,setDeleting]=useState(null);
  function load(){
    if(!tgId){setData({planned:[],archive:[]});return;}
    fetch(`${API}/planned/${tgId}`).then(r=>r.json()).then(setData).catch(()=>setData({planned:[],archive:[]}));
  }
  useEffect(()=>{load();},[]);
  async function del(id){setDeleting(id);try{await fetch(`${API}/planned/${tgId}/${id}`,{method:"DELETE"});load();}catch{}finally{setDeleting(null);};}
  const fmtDt=iso=>{if(!iso)return"—";const d=new Date(new Date(iso).getTime()+5*3600000);return d.toLocaleString("ru",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});};
  const statusColor={scheduled:C.accent,reminded:C.warn,completed:C.success,missed:C.danger};
  if(!data)return <div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader/></div>;
  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>РАСПИСАНИЕ</Kicker><Hero>МОИ ТРЕНИРОВКИ</Hero>
    <div style={{height:16}}/>
    <Kicker>ПРЕДСТОЯЩИЕ</Kicker>
    {data.planned.length===0?<Card style={{marginBottom:16}}><div style={{textAlign:"center",padding:"12px 0",color:C.muted,fontSize:14}}>{t("no_planned")}</div></Card>:
    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
      {data.planned.map(pw=><Card key={pw.id} onClick={()=>onNav("planned_detail",{pwId:pw.id})}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:14,color:C.text}}>{pw.title}</div>
            <div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginTop:3}}>{fmtDt(pw.planned_datetime)}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:11,fontFamily:"monospace",color:statusColor[pw.status]||C.muted}}>{pw.status?.toUpperCase()}</span>
            <button onClick={e=>{e.stopPropagation();del(pw.id);}} disabled={deleting===pw.id} style={{background:"none",border:`0.5px solid ${C.danger}`,borderRadius:6,padding:"3px 8px",color:C.danger,fontSize:11,cursor:"pointer"}}>{deleting===pw.id?"...":"✗"}</button>
          </div>
        </div>
        <div style={{marginTop:8,fontSize:11,color:C.accent,fontFamily:"monospace"}}>ОТКРЫТЬ СОСТАВ →</div>
      </Card>)}
    </div>}
    {data.archive.length>0&&<><Kicker>АРХИВ</Kicker><div style={{display:"flex",flexDirection:"column",gap:8}}>
      {data.archive.map(pw=><Card key={pw.id} onClick={()=>onNav("planned_detail",{pwId:pw.id})} style={{opacity:0.7}}>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <div><div style={{fontWeight:600,fontSize:14,color:C.muted}}>{pw.title}</div><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginTop:2}}>{fmtDt(pw.planned_datetime)}</div></div>
          <span style={{fontSize:11,fontFamily:"monospace",color:statusColor[pw.status]||C.muted}}>{pw.status?.toUpperCase()}</span>
        </div>
      </Card>)}
    </div></>}
  </div>;
}

// ─── PLANNED DETAIL ───────────────────────────────────────────────────────────
function PlannedDetailScreen({pwId,tgId,onBack,exercises=[],muscleGroups=[],readOnly=false,onNav}){
  const [data,setData]=useState(null);
  const [editing,setEditing]=useState(false);
  const [form,setForm]=useState({title:"",date:"",time:""});
  const [editExIds,setEditExIds]=useState([]);
  const [exSearch,setExSearch]=useState("");
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    if(!pwId||!tgId){setData({exercises:[],title:"—",status:"error"});return;}
    fetch(`${API}/planned/${tgId}/${pwId}`)
      .then(r=>{if(!r.ok)throw new Error(r.status);return r.json();})
      .then(d=>{
        setData(d);
        if(d.planned_datetime){
          const dt=new Date(d.planned_datetime);
          setForm({title:d.title||"",date:dt.toISOString().split("T")[0],time:dt.toTimeString().slice(0,5)});
        }
      })
      .catch(()=>setData({exercises:[],title:"Не удалось загрузить",status:"error"}));
  },[pwId]);

  async function save(){
    setSaving(true);
    try{
      const body={title:form.title,planned_datetime:`${form.date}T${form.time}:00`,exercises_ids:editExIds};
      await fetch(`${API}/planned/${tgId}/${pwId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const updated=await fetch(`${API}/planned/${tgId}/${pwId}`).then(r=>r.json());
      setData(updated);setEditing(false);
    }catch{}finally{setSaving(false);}
  }

  if(!data)return <div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader/></div>;
  const dt=data.planned_datetime?new Date(new Date(data.planned_datetime).getTime()+5*3600000).toLocaleString("ru",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"}):"—";

  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>ЗАПЛАНИРОВАННАЯ ТРЕНИРОВКА</Kicker>
    {!editing?<>
      <Hero>{data.title||"Тренировка"}</Hero>
      <div style={{fontSize:13,color:C.accent,fontFamily:"monospace",marginTop:6,marginBottom:16}}>📅 {dt}</div>
      {!readOnly&&data?.status==="scheduled"&&<>
        <Btn accent full onClick={()=>onNav&&onNav("active_workout",{
          preselectedExIds: data.exercises?.map(e=>e.id)||[],
          plannedWorkoutId: pwId,
        })} style={{marginBottom:10}}>{t("start_workout")}</Btn>
        <Btn full onClick={()=>{setEditing(true);setEditExIds(data.exercises?.map(e=>e.id)||[]);setExSearch("");}} style={{marginBottom:16}}>✏ ИЗМЕНИТЬ ДАТУ/СОСТАВ</Btn>
      </>}
      {(readOnly||data?.status==="completed"||data?.status==="missed")&&<Card style={{marginBottom:12,background:data?.status==="completed"?"#00CC6611":"#FF444411",border:`0.5px solid ${data?.status==="completed"?C.success:C.danger}`}}><div style={{fontSize:13,color:data?.status==="completed"?C.success:C.danger,fontFamily:"monospace"}}>{data?.status==="completed"?"✓ ВЫПОЛНЕНА":"📋 АРХИВНАЯ · "+(data.status||"missed").toUpperCase()+" · ТОЛЬКО ПРОСМОТР"}</div></Card>}
      {data.exercises?.length===0?<Card><div style={{textAlign:"center",padding:"16px 0",color:C.muted}}>{readOnly?"Упражнения не были запланированы":"Упражнения не выбраны"}</div></Card>:
      <><Kicker>УПРАЖНЕНИЯ ({data.exercises?.length})</Kicker>
      {data.exercises?.map(ex=><Card key={ex.id} style={{marginBottom:8}}>
        <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
          <Mono color={C.accent} size={20}>{ex.order}</Mono>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:14,color:C.text}}>{ex.name}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{ex.group_emoji} {ex.group_name}</div>
            <div style={{display:"flex",gap:10,marginTop:6}}>
              <Tag color={DIFF_COLOR[ex.difficulty]||C.muted}>{DIFF_LABEL[ex.difficulty]}</Tag>
              <span style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>{ex.sets_recommended}×{ex.reps_recommended}</span>
            </div>
            {ex.description&&<div style={{fontSize:12,color:C.muted,marginTop:6,lineHeight:1.5}}>{ex.description}</div>}
          </div>
        </div>
      </Card>)}</>}
    </>:<>
      <Hero>ИЗМЕНИТЬ</Hero>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:16,marginBottom:16}}>
        <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>НАЗВАНИЕ</div><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} style={{background:"none",border:"none",color:C.text,fontSize:16,width:"100%",outline:"none"}}/></Card>
        <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("sport_date")}</div><div style={{display:"flex",alignItems:"center",gap:8}}><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={{colorScheme:"dark",background:"none",border:"none",color:C.accent,fontSize:18,fontFamily:"monospace",fontWeight:700,outline:"none",flex:1,WebkitAppearance:"none",appearance:"none"}}/><span style={{fontSize:20,flexShrink:0}}>📅</span></div></Card>
        <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ВРЕМЯ</div><div style={{display:"flex",alignItems:"center",gap:8}}><input type="time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} style={{colorScheme:"dark",background:"none",border:"none",color:C.accent,fontSize:18,fontFamily:"monospace",fontWeight:700,outline:"none",flex:1,WebkitAppearance:"none",appearance:"none"}}/><span style={{fontSize:20,flexShrink:0}}>⏰</span></div></Card>
      </div>
      <div style={{marginBottom:16}}>
        <Kicker>УПРАЖНЕНИЯ</Kicker>
        <input value={exSearch} onChange={e=>setExSearch(e.target.value)}
          placeholder="Поиск упражнения..."
          style={{width:"100%",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
            padding:"8px 12px",color:C.text,fontSize:13,outline:"none",
            boxSizing:"border-box",marginTop:6,marginBottom:8}}/>
        {editExIds.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {editExIds.map(id=>{
            const ex=(exercises||[]).find(e=>e.id===id);
            if(!ex)return null;
            return<div key={id} style={{display:"flex",alignItems:"center",gap:4,background:C.card,
              border:`0.5px solid ${C.border}`,borderRadius:8,padding:"4px 8px",fontSize:11}}>
              <span style={{color:C.text}}>{ex.name}</span>
              <button onClick={()=>setEditExIds(p=>p.filter(i=>i!==id))}
                style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:12,padding:0}}>✕</button>
            </div>;
          })}
        </div>}
        <div style={{maxHeight:200,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
          {(exercises||[]).filter(e=>
            !editExIds.includes(e.id)&&
            (!exSearch||e.name.toLowerCase().includes(exSearch.toLowerCase()))
          ).slice(0,20).map(ex=>(
            <button key={ex.id} onClick={()=>setEditExIds(p=>[...p,ex.id])}
              style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,
                padding:"8px 12px",color:C.text,fontSize:12,cursor:"pointer",
                textAlign:"left",display:"flex",justifyContent:"space-between"}}>
              <span>{ex.group_emoji} {ex.name}</span>
              <span style={{color:C.accent}}>+</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:10}}><Btn full onClick={()=>setEditing(false)} style={{flex:1}}>ОТМЕНА</Btn><Btn accent full onClick={save} disabled={saving} style={{flex:2}}>{saving?"...":t("save_profile")}</Btn></div>
    </>}
  </div>;
}

// ─── PLAN WORKOUT ─────────────────────────────────────────────────────────────
function PlanWorkoutScreen({tgId,exercises,muscleGroups,onBack}){
  const [step,setStep]=useState(0); // 0=group, 1=exercises, 2=datetime
  const [selGroups,setSelGroups]=useState(new Set()); // мультивыбор групп
  const [selExs,setSelExs]=useState([]);
  const [form,setForm]=useState({title:"",date:"",time:"10:00"});
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [search,setSearch]=useState("");
  const [viewEx,setViewEx]=useState(null); // просмотр карточки

  const filtered=(exercises||[]).filter(e=>(selGroups.size===0||selGroups.has(e.muscle_group_id))&&(!search||e.name.toLowerCase().includes(search.toLowerCase())));
  const toggle=ex=>setSelExs(prev=>prev.find(e=>e.id===ex.id)?prev.filter(e=>e.id!==ex.id):[...prev,ex]);

  async function save(){
    if(!form.date||!form.time)return;
    setSaving(true);
    try{
      // Проверяем конфликт времени
      const planDt=new Date(`${form.date}T${form.time}:00`);
      const planned=await fetch(`${API}/planned/${tgId}`).then(r=>r.json()).catch(()=>({planned:[]}));
      const conflict=(planned.planned||[]).find(pw=>{
        const pwDt=new Date(pw.planned_datetime);
        return Math.abs(planDt-pwDt)<60*60*1000; // ±1 час
      });
      if(conflict){
        const ok=window.confirm(`На ${planDt.toLocaleString("ru",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})} уже есть тренировка "${conflict.title}". Выбрать другое время?`);
        if(ok){setSaving(false);return;}
      }
      const title=form.title||selExs.slice(0,2).map(e=>e.name.split(" ")[0]).join("+")||"Тренировка";
      const res=await fetch(`${API}/planned/${tgId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,planned_datetime:`${form.date}T${form.time}:00`,exercise_ids:selExs.map(e=>e.id)})});
      if(res.ok)setSaved(true);
    }catch{}finally{setSaving(false);}
  }

  if(saved)return <div style={{padding:"16px 16px 100px"}}>
    <div style={{textAlign:"center",paddingTop:60}}>
      <div style={{fontSize:48,color:C.accent}}>📅</div>
      <Hero style={{textAlign:"center",marginTop:16}}>ЗАПЛАНИРОВАНО</Hero>
      <div style={{color:C.muted,marginTop:8,fontFamily:"monospace"}}>Бот напомнит за 1 час</div>
      <Btn accent full onClick={onBack} style={{marginTop:32}}>← НАЗАД</Btn>
    </div>
  </div>;

  if(step===0)return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={onBack}/>
      <Kicker>ПЛАНИРОВАНИЕ · ШАГ 1</Kicker><Hero>{t("muscles_title")}</Hero>
      <div style={{fontSize:13,color:C.muted,marginTop:8,marginBottom:16}}>Выбери одну или несколько групп</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        {muscleGroups?.map(g=>{
          const sel=selGroups.has(g.id);
          return(
            <Card key={g.id} accent={sel} onClick={()=>setSelGroups(p=>{const n=new Set(p);if(n.has(g.id))n.delete(g.id);else n.add(g.id);return n;})}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><span style={{fontSize:22,marginRight:12}}>{g.emoji}</span><span style={{fontSize:15,fontWeight:600,color:sel?C.accent:C.text}}>{g.name}</span></div>
                <span style={{width:22,height:22,borderRadius:6,background:sel?C.accent:C.card,border:`0.5px solid ${sel?C.accent:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:sel?C.bg:C.muted,flexShrink:0}}>{sel?"✓":""}</span>
              </div>
            </Card>
          );
        })}
      </div>
      {selGroups.size>0&&<div style={{marginBottom:10,fontSize:11,color:C.accent,fontFamily:"monospace"}}>ВЫБРАНО: {(muscleGroups||[]).filter(g=>selGroups.has(g.id)).map(g=>g.emoji+g.name).join(", ")}</div>}
      <Btn accent full onClick={()=>setStep(1)}>{selGroups.size===0?"ВСЕ УПРАЖНЕНИЯ →":`УПРАЖНЕНИЯ (${selGroups.size} групп) →`}</Btn>
    </div>
  );

  // Просмотр карточки упражнения
  if(step===1&&viewEx)return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={()=>setViewEx(null)}/>
      {viewEx.photo_url&&<img src={viewEx.photo_url} alt={viewEx.name} style={{width:"100%",borderRadius:12,marginBottom:14,objectFit:"cover",maxHeight:220}} onError={e=>e.target.style.display="none"}/>}
      <Kicker>{viewEx.group_emoji} {viewEx.group_name?.toUpperCase()}</Kicker>
      <Hero style={{fontSize:20}}>{viewEx.name}</Hero>
      <div style={{height:12}}/>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[{l:"ПОДХОДОВ",v:viewEx.sets_recommended},{l:"ПОВТОРЕНИЙ",v:viewEx.reps_recommended},{l:"СЛОЖНОСТЬ",v:DIFF_LABEL[viewEx.difficulty]||viewEx.difficulty}].map((s,i)=>(
          <Card key={i} style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:4}}>{s.l}</div>
            <div style={{fontSize:14,fontWeight:700,color:C.accent}}>{s.v||"—"}</div>
          </Card>
        ))}
      </div>
      {viewEx.description&&<Card style={{marginBottom:10}}><Kicker>ОПИСАНИЕ</Kicker><div style={{fontSize:14,color:C.text,lineHeight:1.6,marginTop:6}}>{viewEx.description}</div></Card>}
      {viewEx.equipment&&<Card style={{marginBottom:14}}><Kicker>ОБОРУДОВАНИЕ</Kicker><div style={{fontSize:14,color:C.text,marginTop:4}}>{viewEx.equipment}</div></Card>}
      <div style={{display:"flex",gap:10}}>
        <Btn full onClick={()=>setViewEx(null)} style={{flex:1}}>← НАЗАД</Btn>
        <Btn accent full onClick={()=>{
          setSelExs(prev=>prev.find(e=>e.id===viewEx.id)?prev.filter(e=>e.id!==viewEx.id):[...prev,viewEx]);
          setViewEx(null);
        }} style={{flex:2}}>
          {selExs.find(e=>e.id===viewEx.id)?"✓ УБРАТЬ ИЗ ТРЕНИРОВКИ":"+ ДОБАВИТЬ В ТРЕНИРОВКУ"}
        </Btn>
      </div>
    </div>
  );

  if(step===1)return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={()=>setStep(0)}/><Kicker>ПЛАНИРОВАНИЕ · ШАГ 2</Kicker><Hero>УПРАЖНЕНИЯ</Hero>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ПОИСК..." style={{width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:13,fontFamily:"monospace",outline:"none",boxSizing:"border-box",marginTop:12,marginBottom:12}}/>
    {selExs.length>0&&<div style={{marginBottom:12}}><Kicker>ВЫБРАНО ({selExs.length})</Kicker><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{selExs.map((e,i)=><Tag key={e.id} color={C.accent}>{i+1}. {e.name.split(" ").slice(0,2).join(" ")}</Tag>)}</div></div>}
    {filtered.slice(0,50).map(ex=>{const sel=selExs.find(e=>e.id===ex.id);return<ExCard key={ex.id} ex={ex} badge={DIFF_LABEL[ex.difficulty]}
      onClick={()=>setViewEx(ex)}
      action={<button onClick={e=>{e.stopPropagation();toggle(ex);}} style={{flexShrink:0,width:32,height:32,borderRadius:8,background:sel?C.accent:C.card,border:`0.5px solid ${sel?C.accent:C.border}`,color:sel?C.bg:C.muted,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{sel?`${selExs.indexOf(sel)+1}`:"+"}</button>}/>;
    })}
    {selExs.length>0&&<div style={{position:"sticky",bottom:80,marginTop:12}}><Btn accent full onClick={()=>setStep(2)}>ДАЛЕЕ → ДАТА И ВРЕМЯ</Btn></div>}
  </div>;

  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={()=>setStep(1)}/><Kicker>ПЛАНИРОВАНИЕ · ШАГ 3</Kicker><Hero>ДАТА И ВРЕМЯ</Hero>
    <div style={{height:16}}/>
    <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
      <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>НАЗВАНИЕ (ОПЦИОНАЛЬНО)</div><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder={selExs.slice(0,2).map(e=>e.name.split(" ")[0]).join("+")||"Моя тренировка"} style={{background:"none",border:"none",color:C.text,fontSize:16,width:"100%",outline:"none"}}/></Card>
      <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("sport_date")}</div><div style={{display:"flex",alignItems:"center",gap:8}}><input id="plan-date-input" type="date" value={form.date} min={new Date().toISOString().split("T")[0]} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={{colorScheme:"dark",background:"none",border:"none",color:C.accent,fontSize:20,fontFamily:"monospace",fontWeight:700,outline:"none",flex:1,WebkitAppearance:"none",appearance:"none"}}/><span style={{fontSize:22,flexShrink:0}}>📅</span></div></Card>
      <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ВРЕМЯ</div><div style={{display:"flex",alignItems:"center",gap:8}}><input id="plan-time-input" type="time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} style={{colorScheme:"dark",background:"none",border:"none",color:C.accent,fontSize:20,fontFamily:"monospace",fontWeight:700,outline:"none",flex:1,WebkitAppearance:"none",appearance:"none"}}/><span style={{fontSize:22,flexShrink:0}}>⏰</span></div></Card>
    </div>
    <div style={{marginBottom:16}}><Kicker>УПРАЖНЕНИЯ ({selExs.length})</Kicker>{selExs.map((e,i)=><div key={e.id} style={{padding:"6px 0",borderBottom:`0.5px solid ${C.border}`,display:"flex",gap:10}}><Mono color={C.accent} size={13}>{i+1}</Mono><span style={{fontSize:13,color:C.text}}>{e.name}</span></div>)}</div>
    <Btn accent full onClick={save} disabled={saving||!form.date}>{saving?"СОХРАНЯЕМ...":"📅 ЗАПЛАНИРОВАТЬ"}</Btn>
    <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",textAlign:"center",marginTop:8}}>Бот напомнит за 1 час до тренировки</div>
  </div>;
}

// ─── STANDALONE TIMER (из меню) ──────────────────────────────────────────────
function StandaloneTimer({onBack}){
  return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={onBack}/>
      <Kicker>ИНСТРУМЕНТЫ</Kicker>
      <Hero>ТАЙМЕР ОТДЫХА</Hero>
      <div style={{height:16}}/>
      <Card>
        <div style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:12}}>
          Таймер автоматически запускается после каждого подхода во время тренировки.<br/>
          Здесь можно использовать отдельно.
        </div>
      </Card>
      <div style={{marginTop:16,position:"relative"}}>
        <RestTimer onClose={onBack} standalone/>
      </div>
    </div>
  );
}

// ─── WEIGHT CHART ─────────────────────────────────────────────────────────────
function WeightChart({logs}){
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(()=>{
    if(!logs||logs.length<2||!canvasRef.current)return;

    // Уничтожаем предыдущий график
    if(chartRef.current){chartRef.current.destroy();}

    const sorted = [...logs].sort((a,b)=>new Date(a.logged_at)-new Date(b.logged_at)).slice(-30);
    const labels = sorted.map(w=>{
      const d=new Date(w.logged_at);
      return d.toLocaleDateString("ru",{day:"numeric",month:"short"});
    });
    const data = sorted.map(w=>parseFloat(w.weight)||0);
    const minW = Math.min(...data)-1;
    const maxW = Math.max(...data)+1;

    chartRef.current = new window.Chart(canvasRef.current,{
      type:"line",
      data:{
        labels,
        datasets:[{
          label:"Вес (кг)",
          data,
          borderColor:"#C8FF00",
          backgroundColor:"rgba(200,255,0,0.08)",
          borderWidth:2,
          pointBackgroundColor:"#C8FF00",
          pointRadius:4,
          pointHoverRadius:6,
          fill:true,
          tension:0.3,
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          tooltip:{
            backgroundColor:"#222222",
            titleColor:"#888888",
            bodyColor:"#C8FF00",
            borderColor:"#2A2A2A",
            borderWidth:1,
          }
        },
        scales:{
          x:{
            ticks:{color:"#888888",font:{size:10},maxRotation:45},
            grid:{color:"rgba(255,255,255,0.05)"},
          },
          y:{
            min:minW,max:maxW,
            ticks:{color:"#888888",font:{size:10},callback:v=>`${v} кг`},
            grid:{color:"rgba(255,255,255,0.05)"},
          }
        }
      }
    });

    return()=>{if(chartRef.current)chartRef.current.destroy();};
  },[logs]);

  // Загружаем Chart.js если нет
  useEffect(()=>{
    if(window.Chart)return;
    const script=document.createElement("script");
    script.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    script.onload=()=>{if(canvasRef.current&&logs?.length>=2){/* перерисует useEffect выше */}};
    document.head.appendChild(script);
  },[]);

  const sorted=[...logs].sort((a,b)=>new Date(a.logged_at)-new Date(b.logged_at));
  const first=parseFloat(sorted[0]?.weight||0);
  const last=parseFloat(sorted[sorted.length-1]?.weight||0);
  const delta=Math.round((last-first)*10)/10;

  return(
    <Card style={{marginTop:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <Kicker>ДИНАМИКА ВЕСА</Kicker>
        <div style={{textAlign:"right"}}>
          <Mono size={16}>{last} кг</Mono>
          {delta!==0&&<div style={{fontSize:11,fontFamily:"monospace",color:delta<0?C.success:C.danger,marginTop:2}}>
            {delta>0?"+":""}{delta} кг за период
          </div>}
        </div>
      </div>
      <div style={{position:"relative",height:160}}>
        <canvas ref={canvasRef} role="img" aria-label={`График веса: от ${first} до ${last} кг`}/>
      </div>
    </Card>
  );
}

// ─── PROGRESS ─────────────────────────────────────────────────────────────────
function MuscleGroupChart({data,groupName,emoji}){
  if(!data||data.length===0)return null;
  // При 1 тренировке показываем карточку с данными без графика
  if(data.length===1){
    const d=data[0];
    return<Card style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <Kicker>{emoji} {groupName.toUpperCase()}</Kicker>
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>1 тр-ка</div>
      </div>
      <div style={{display:"flex",gap:16,padding:"8px 0"}}>
        <div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>ДАТА</div><Mono size={13}>{String(d.date).slice(0,10).slice(5)}</Mono></div>
        <div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>MAX ВЕС</div><Mono size={13}>{d.max_weight}кг</Mono></div>
        <div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>ОБЪЁМ</div><Mono size={13}>{Math.round(d.volume)}</Mono></div>
        <div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>ПОДХОДОВ</div><Mono size={13}>{d.sets}</Mono></div>
      </div>
      <div style={{fontSize:11,color:C.muted,marginTop:4}}>Нужно ≥2 тренировок для графика</div>
    </Card>;
  }
  const maxVol=Math.max(...data.map(d=>d.volume),1);
  const maxW=Math.max(...data.map(d=>d.max_weight),1);
  const W=300;const H=100;const pad=12;
  // Форматируем дату MM-DD из строки YYYY-MM-DD или timestamp
  const fmtDate=s=>{
    if(!s)return"";
    const clean=String(s).slice(0,10); // берём только YYYY-MM-DD
    return clean.slice(5); // MM-DD
  };
  const pts=data.map((d,i)=>{
    const x=pad+i*(W-pad*2)/(data.length-1);
    const y=H-pad-(d.volume/maxVol)*(H-pad*2);
    return `${x},${y}`;
  });
  return<Card style={{marginBottom:12}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <Kicker>{emoji} {groupName.toUpperCase()}</Kicker>
      <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>
        max {Math.round(maxW)}кг · {data.length} тр-к
      </div>
    </div>
    <div style={{width:"100%",overflow:"hidden"}}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"100px",display:"block"}}>
        <polyline points={pts.join(" ")} fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {data.map((d,i)=>{
          const x=pad+i*(W-pad*2)/(data.length-1);
          const y=H-pad-(d.volume/maxVol)*(H-pad*2);
          return<circle key={i} cx={x} cy={y} r="4" fill={C.accent}/>;
        })}
      </svg>
    </div>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.muted,fontFamily:"monospace",marginTop:4}}>
      <span>{fmtDate(data[0]?.date)}</span>
      <span>объём (кг×повт)</span>
      <span>{fmtDate(data[data.length-1]?.date)}</span>
    </div>
    <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
      {data.slice(-3).map((d,i)=><div key={i} style={{fontSize:10}}>
        <div style={{color:C.muted,fontFamily:"monospace"}}>{fmtDate(d.date)}</div>
        <div style={{color:C.accent,fontWeight:600}}>max {d.max_weight}кг</div>
        <div style={{color:C.muted}}>объём {Math.round(d.volume)}</div>
      </div>)}
    </div>
  </Card>;
}

function ProgressScreen({stats,tgId}){
  const [muscleData,setMuscleData]=useState(null);
  const [activeGroup,setActiveGroup]=useState(null);
  const [days,setDays]=useState(90);

  useEffect(()=>{
    if(!tgId)return;
    setMuscleData(null);
    fetch(`${API}/progress/muscle-groups/${tgId}?days=${days}`)
      .then(r=>r.json())
      .then(d=>setMuscleData(d))
      .catch(()=>setMuscleData({}));
  },[tgId,days]);

  if(!stats)return <div style={{padding:"16px 16px 100px"}}><Loader text="ПРОГРЕСС"/></div>;
  const weekly=stats.weekly_workouts||[];const peak=Math.max(...weekly,1);
  const blocks=" ▁▂▃▄▅▆▇█";const spark=weekly.map(v=>blocks[Math.min(8,Math.round(8*v/peak))]).join("");

  const groups=Object.entries(muscleData?.by_group||{});
  const selectedGroup=activeGroup&&muscleData?.by_group?.[activeGroup];

  return <div style={{padding:"16px 16px 100px"}}>
    <Kicker>{stats.period_days||30} ДНЕЙ</Kicker><Hero>МОЙ ПРОГРЕСС</Hero>
    <div style={{height:16}}/>

    {/* Основные метрики */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
      {[
        {l:"ТРЕНИРОВОК",v:stats.total_workouts||0},
        {l:"ПОДХОДОВ",v:stats.total_sets||0},
        {l:"ТОННАЖ",v:`${Math.round((stats.total_volume||0)/1000*10)/10} т`},
        {l:"СЕРИЯ",v:`${stats.streak_days||0} дн`}
      ].map((s,i)=><Card key={i}>
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:4}}>{s.l}</div>
        <Mono>{s.v}</Mono>
      </Card>)}
    </div>

    {/* График по неделям */}
    {weekly.length>0&&<Card style={{marginBottom:16}}>
      <Kicker>АКТИВНОСТЬ ПО НЕДЕЛЯМ</Kicker>
      <div style={{fontFamily:"monospace",fontSize:22,color:C.accent,letterSpacing:2,margin:"8px 0"}}>{spark||"нет данных"}</div>
      <div style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>тренировок в неделю</div>
    </Card>}

    {/* Прогресс по группам мышц */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <Kicker>ПРОГРЕСС ПО ГРУППАМ МЫШЦ</Kicker>
      <select value={days} onChange={e=>setDays(Number(e.target.value))}
        style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:6,
          padding:"4px 8px",color:C.accent,fontSize:11,fontFamily:"monospace",outline:"none"}}>
        <option value={30}>30 дней</option>
        <option value={60}>60 дней</option>
        <option value={90}>90 дней</option>
        <option value={180}>180 дней</option>
      </select>
    </div>

    {!muscleData?<Loader text="ЗАГРУЗКА"/>:groups.length===0?
      <Card style={{marginBottom:16}}><div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"12px 0"}}>Нет данных за выбранный период</div></Card>:
      <>
        {/* Кнопки групп мышц */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          <button onClick={()=>setActiveGroup(null)}
            style={{padding:"6px 12px",borderRadius:20,fontSize:11,cursor:"pointer",
              background:!activeGroup?C.accent:C.card,
              border:`0.5px solid ${!activeGroup?C.accent:C.border}`,
              color:!activeGroup?C.bg:C.muted,fontFamily:"monospace"}}>ВСЕ</button>
          {groups.map(([name,g])=><button key={name} onClick={()=>setActiveGroup(activeGroup===name?null:name)}
            style={{padding:"6px 12px",borderRadius:20,fontSize:11,cursor:"pointer",
              background:activeGroup===name?C.accent:C.card,
              border:`0.5px solid ${activeGroup===name?C.accent:C.border}`,
              color:activeGroup===name?C.bg:C.muted}}>
            {g.emoji} {name} ({g.workouts.length})
          </button>)}
        </div>

        {/* Графики */}
        {(activeGroup?[[activeGroup,selectedGroup]]:groups).map(([name,g])=>
          g&&<MuscleGroupChart key={name} data={g.workouts} groupName={name} emoji={g.emoji}/>
        )}
      </>
    }

    {/* Вес */}
    {stats.weight_logs?.length>0&&<WeightChart logs={stats.weight_logs}/>}

    {/* Плато детектор */}
    <PlateauBlock tgId={tgId}/>
  </div>;
}

// ─── CATALOG ──────────────────────────────────────────────────────────────────
function CatalogScreen({exercises,muscleGroups}){
  const [activeGroup,setActiveGroup]=useState(null);
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const filtered=(exercises||[]).filter(e=>(!activeGroup||e.muscle_group_id===activeGroup)&&(!search||e.name.toLowerCase().includes(search.toLowerCase())));

  if(selected)return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={()=>setSelected(null)}/>
    {selected.photo_url&&<img src={selected.photo_url} alt={selected.name} style={{width:"100%",borderRadius:12,marginBottom:14,objectFit:"cover",maxHeight:220}} onError={e=>e.target.style.display="none"}/>}
    <Kicker>{selected.group_emoji} {selected.group_name?.toUpperCase()}</Kicker><Hero>{selected.name}</Hero>
    <div style={{height:12}}/>
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      {[{l:"ПОДХОДОВ",v:selected.sets_recommended},{l:"ПОВТОРЕНИЙ",v:selected.reps_recommended},{l:"СЛОЖНОСТЬ",v:DIFF_LABEL[selected.difficulty]||selected.difficulty}].map((s,i)=><Card key={i} style={{flex:1,textAlign:"center"}}><div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:4}}>{s.l}</div><div style={{fontSize:14,fontWeight:700,color:C.accent}}>{s.v||"—"}</div></Card>)}
    </div>
    {selected.description&&<Card style={{marginBottom:10}}><Kicker>ОПИСАНИЕ</Kicker><div style={{fontSize:14,color:C.text,lineHeight:1.6,marginTop:6}}>{selected.description}</div></Card>}
    {selected.equipment&&<Card><Kicker>ОБОРУДОВАНИЕ</Kicker><div style={{fontSize:14,color:C.text,marginTop:4}}>{selected.equipment}</div></Card>}
  </div>;

  return <div style={{padding:"16px 16px 100px"}}>
    <Kicker>БАЗА ЗНАНИЙ</Kicker><Hero>УПРАЖНЕНИЯ</Hero>
    <div style={{height:12}}/>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ПОИСК..." style={{width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:13,fontFamily:"monospace",letterSpacing:1,boxSizing:"border-box",marginBottom:12,outline:"none"}}/>
    <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:12}}>
      <button onClick={()=>setActiveGroup(null)} style={{flexShrink:0,padding:"6px 12px",borderRadius:20,background:!activeGroup?C.accent:C.card,color:!activeGroup?C.bg:C.muted,border:`0.5px solid ${!activeGroup?C.accent:C.border}`,fontSize:11,fontFamily:"monospace",cursor:"pointer",fontWeight:700}}>ВСЕ</button>
      {muscleGroups?.map(g=><button key={g.id} onClick={()=>setActiveGroup(g.id===activeGroup?null:g.id)} style={{flexShrink:0,padding:"6px 12px",borderRadius:20,background:activeGroup===g.id?C.accent:C.card,color:activeGroup===g.id?C.bg:C.muted,border:`0.5px solid ${activeGroup===g.id?C.accent:C.border}`,fontSize:11,fontFamily:"monospace",cursor:"pointer"}}>{g.emoji} {g.name.toUpperCase()}</button>)}
    </div>
    <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{filtered.length} УПРАЖНЕНИЙ</div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {filtered.slice(0,60).map(ex=>(
        <Card key={ex.id} onClick={()=>setSelected(ex)} style={{marginBottom:0}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            {ex.photo_url&&<img src={ex.photo_url} alt="" style={{width:56,height:56,borderRadius:8,objectFit:"cover",flexShrink:0}} onError={e=>e.target.style.display="none"}/>}
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <div style={{fontWeight:600,fontSize:14,color:C.text,lineHeight:1.3}}>{ex.name}</div>
                <Tag color={DIFF_COLOR[ex.difficulty]||C.muted}>{DIFF_LABEL[ex.difficulty]}</Tag>
              </div>
              <div style={{fontSize:11,color:C.muted,marginTop:3}}>{ex.group_emoji} {ex.group_name}</div>
              <div style={{display:"flex",gap:10,marginTop:6,alignItems:"center"}}>
                <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{ex.sets_recommended} подх</span>
                <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{ex.reps_recommended} повт</span>
                {ex.equipment&&<span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{ex.equipment}</span>}
                <span style={{fontSize:10,color:C.accent,fontFamily:"monospace",marginLeft:"auto"}}>ПОДРОБНЕЕ →</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>;
}

// ─── AI ───────────────────────────────────────────────────────────────────────
// ── VoiceRecorder — запись голоса и транскрипция ────────────────────────────
function VoiceRecorder({tgId,onTranscribed,disabled=false}){
  const [recording,setRecording]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const [seconds,setSeconds]=useState(0);
  const mediaRef=useRef(null);
  const chunksRef=useRef([]);
  const timerRef=useRef(null);

  async function startRec(){
    setError(null);
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
      // Определяем поддерживаемый формат
      const mimeType=["audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus","audio/ogg","audio/mp4"]
        .find(t=>MediaRecorder.isTypeSupported(t))||"";
      const mr=new MediaRecorder(stream,mimeType?{mimeType}:{});
      chunksRef.current=[];
      mr.ondataavailable=e=>{if(e.data&&e.data.size>0)chunksRef.current.push(e.data);};
      mr.onstop=async()=>{
        stream.getTracks().forEach(t=>t.stop());
        if(chunksRef.current.length===0){
          setError("Нет данных аудио");
          setLoading(false);
          return;
        }
        const finalMime=mr.mimeType||mimeType||"audio/webm";
        const blob=new Blob(chunksRef.current,{type:finalMime});
        console.log("[Voice] blob size:",blob.size,"type:",finalMime);
        await transcribe(blob,finalMime);
      };
      mr.start(); // без timeslice — один chunk при stop
      mediaRef.current=mr;
      setRecording(true);
      setSeconds(0);
      timerRef.current=setInterval(()=>setSeconds(s=>s+1),1000);
    }catch(e){
      console.error("[Voice] startRec error:",e);
      setError(e.name==="NotAllowedError"?"Нет доступа к микрофону":e.message||"Ошибка");
    }
  }

  function stopRec(){
    clearInterval(timerRef.current);
    setRecording(false);
    setLoading(true);
    if(mediaRef.current&&mediaRef.current.state!=="inactive"){
      mediaRef.current.requestData(); // принудительно сбрасываем буфер
      mediaRef.current.stop();
    }
  }

  async function transcribe(blob,mimeType){
    try{
      // Определяем расширение для Whisper
      const ext=mimeType.includes("ogg")?"ogg":mimeType.includes("mp4")?"mp4":"webm";
      const res=await fetch(`${API}/voice/transcribe?tg_id=${tgId}&ext=${ext}`,{
        method:"POST",
        headers:{"Content-Type":mimeType||"audio/webm"},
        body:blob,
      });
      if(!res.ok){
        const e=await res.json().catch(()=>({detail:"Ошибка сервера"}));
        throw new Error(e.detail||"Ошибка");
      }
      const d=await res.json();
      if(!d.text)throw new Error("Речь не распознана");
      onTranscribed(d.text);
    }catch(e){
      console.error("[Voice] transcribe error:",e);
      setError(e.message||"Ошибка транскрипции");
    }finally{
      setLoading(false);
    }
  }

  const fmt=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  return(
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      {error&&<div style={{fontSize:11,color:C.danger,flex:1}}>{error}</div>}
      {loading&&<div style={{fontSize:11,color:C.muted,fontFamily:"monospace",flex:1}}>РАСПОЗНАЮ...</div>}
      {recording&&!loading&&(
        <div style={{fontSize:12,color:C.danger,fontFamily:"monospace",flex:1}}>
          ● {fmt(seconds)}
        </div>
      )}
      <button
        onClick={recording?stopRec:startRec}
        disabled={disabled||loading}
        style={{
          width:44,height:44,borderRadius:"50%",
          background:recording?C.danger:C.card,
          border:`1.5px solid ${recording?C.danger:C.border}`,
          color:recording?"#fff":C.muted,
          fontSize:20,cursor:"pointer",flexShrink:0,
          display:"flex",alignItems:"center",justifyContent:"center",
          transition:"all 0.2s",
          opacity:disabled||loading?0.5:1,
        }}>
        {loading?"⏳":recording?"⬛":"🎙"}
      </button>
    </div>
  );
}



function AIScreen({user,tgId,onNav,exercises=[]}){
  const [q,setQ]=useState("");
  const [answer,setAnswer]=useState(null);
  const [workoutPlan,setWorkoutPlan]=useState(null);
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const requestsLeft=5-(user?.ai_requests_today||0);
  const suggs=["Составь план тренировки на неделю под набор массы","Что есть до и после тренировки","Программа для похудения на месяц","Тренировка на плечи и руки"];

  async function ask(question){
    if(!question.trim()||loading)return;
    setLoading(true);setAnswer(null);setWorkoutPlan(null);setSaved(false);setQ("");
    try{
      const res=await fetch(`${API}/ai/ask`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({question,tg_id:tgId})});
      if(res.status===429){setAnswer("Дневной лимит запросов исчерпан. Попробуй завтра.");return;}
      if(!res.ok){
        const err=await res.text().catch(()=>"");
        setAnswer(`Ошибка сервера (${res.status})${err?" — "+err.slice(0,100):""}. Попробуй позже.`);
        return;
      }
      const d=await res.json();
      setAnswer(d.answer||"Нет ответа");
      if(d.workout_plan)setWorkoutPlan(d.workout_plan);
    }catch(e){setAnswer("Ошибка соединения — "+e.message);}
    finally{setLoading(false);}
  }

  const [showDatePicker,setShowDatePicker]=useState(false);
  const [planDate,setPlanDate]=useState(()=>{const d=new Date();d.setDate(d.getDate()+1);return d.toISOString().split("T")[0];});
  const [planTime,setPlanTime]=useState("10:00");

  async function saveWorkoutPlan(){
    if(!workoutPlan||!tgId)return;
    setShowDatePicker(true);
  }

  async function confirmSaveWorkoutPlan(){
    setShowDatePicker(false);
    setSaving(true);
    try{
      // Конвертируем названия упражнений в ID из каталога
      const exNames = workoutPlan.exercises||[];
      const exIds = exNames.map(name=>{
        const nameLow = name.toLowerCase().trim();
        // Сначала точное совпадение
        let found = (exercises||[]).find(e=>e.name.toLowerCase().trim()===nameLow);
        // Потом частичное — каталог содержит название AI или наоборот
        if(!found) found = (exercises||[]).find(e=>
          e.name.toLowerCase().includes(nameLow) || nameLow.includes(e.name.toLowerCase())
        );
        // Потом по ключевым словам (первые 2 слова)
        if(!found){
          const words = nameLow.split(" ").filter(w=>w.length>3).slice(0,2);
          if(words.length>0) found = (exercises||[]).find(e=>
            words.every(w=>e.name.toLowerCase().includes(w))
          );
        }
        return found?.id||null;
      }).filter(Boolean);

      // Сохраняем в запланированные — выбранная дата и время
      const dt=`${planDate}T${planTime}`;
      const res=await fetch(`${API}/planned/${tgId}`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({title:workoutPlan.title||"AI тренировка",planned_datetime:dt,
          exercise_ids:exIds,
          exercise_names:workoutPlan.exercises||[]})});
      if(res.ok){setSaved(true);setWorkoutPlan(null);}
      else setSaving(false);
    }catch{setSaving(false);}
    finally{setSaving(false);}
  }

  return <div style={{padding:"16px 16px 100px"}}>
    <Kicker>AI ТРЕНЕР</Kicker><Hero>ТРЕНЕР НА СВЯЗИ</Hero>
    <div style={{color:C.muted,fontSize:13,marginTop:6,marginBottom:16,fontFamily:"monospace"}}>ЗАПРОСОВ ОСТАЛОСЬ · <Mono size={13}>{requestsLeft}</Mono></div>
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
        <VoiceRecorder tgId={tgId} disabled={loading} onTranscribed={text=>setQ(prev=>prev?prev+" "+text:text)}/>
        <div style={{flex:1,background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,display:"flex",alignItems:"center"}}>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask(q)}
            placeholder="СПРОСИ ЧТО УГОДНО..." style={{flex:1,background:"none",border:"none",padding:"10px 14px",color:C.text,fontSize:13,fontFamily:"monospace",outline:"none"}}/>
          <button onClick={()=>ask(q)} disabled={loading||!q.trim()}
            style={{background:C.accent,border:"none",borderRadius:"0 8px 8px 0",padding:"10px 16px",color:C.bg,fontWeight:700,fontSize:14,cursor:"pointer",opacity:loading||!q.trim()?0.5:1}}>→</button>
        </div>
      </div>
      <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>🎙 НАЖМИ ДЛЯ ЗАПИСИ ГОЛОСА · ИЛИ НАПИШИ</div>
    </div>
    <div style={{marginBottom:16}}>
      <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>БЫСТРЫЕ ВОПРОСЫ</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {suggs.map((s,i)=><button key={i} onClick={()=>{setQ(s);ask(s);}}
          style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:13,cursor:"pointer",textAlign:"left"}}>{s} →</button>)}
      </div>
    </div>
    {loading&&<Card><div style={{textAlign:"center",padding:"16px 0"}}><div style={{color:C.accent,fontFamily:"monospace",fontSize:12,letterSpacing:2}}>ТРЕНЕР ДУМАЕТ...</div></div></Card>}
    {answer&&<Card accent>
      <Kicker>ОТВЕТ ТРЕНЕРА</Kicker>
      <div style={{fontSize:14,color:C.text,lineHeight:1.6,marginTop:8,whiteSpace:"pre-wrap"}}>{answer}</div>

      {/* Кнопка сохранения тренировки если AI предложил план */}
      {workoutPlan&&!saved&&(
        <div style={{marginTop:16,padding:"12px 14px",background:"#C8FF0015",border:`0.5px solid ${C.accent}`,borderRadius:10}}>
          <div style={{fontSize:12,color:C.accent,fontFamily:"monospace",marginBottom:6}}>💪 AI ПРЕДЛАГАЕТ ТРЕНИРОВКУ</div>
          <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:4}}>{workoutPlan.title}</div>
          {workoutPlan.exercises?.length>0&&(
            <div style={{fontSize:12,color:C.muted,marginBottom:6}}>{workoutPlan.exercises.slice(0,5).join(", ")}{workoutPlan.exercises.length>5?` +${workoutPlan.exercises.length-5} ещё`:""}</div>
          )}
          {workoutPlan.exercises?.length>0&&exercises?.length>0&&(()=>{
            const matched = workoutPlan.exercises.filter(name=>{
              const nameLow=name.toLowerCase().trim();
              return exercises.find(e=>e.name.toLowerCase().trim()===nameLow||e.name.toLowerCase().includes(nameLow)||nameLow.includes(e.name.toLowerCase()));
            });
            return matched.length<workoutPlan.exercises.length?(
              <div style={{fontSize:11,color:C.warn,fontFamily:"monospace",marginBottom:6}}>
                ⚠ Найдено в каталоге: {matched.length}/{workoutPlan.exercises.length}
              </div>
            ):null;
          })()}
          <Btn accent full onClick={saveWorkoutPlan} disabled={saving}>
            {saving?"СОХРАНЯЕМ...":"📅 СОХРАНИТЬ В РАСПИСАНИЕ"}
          </Btn>
          <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",textAlign:"center",marginTop:6}}>Выбери дату и время перед сохранением</div>
        </div>
      )}
      {saved&&<div style={{marginTop:12,background:"#00CC6622",border:`0.5px solid ${C.success}`,borderRadius:10,padding:"10px 14px",fontSize:12,color:C.success,fontFamily:"monospace"}}>✓ ТРЕНИРОВКА СОХРАНЕНА → вкладка Запланированные</div>}

      {showDatePicker&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:C.surface,borderRadius:16,padding:20,width:"100%",maxWidth:360}}>
            <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:16,fontFamily:"monospace"}}>📅 КОГДА ТРЕНИРОВКА?</div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:6}}>{t("sport_date")}</div>
              <input type="date" value={planDate} min={new Date().toISOString().split("T")[0]}
                onChange={e=>setPlanDate(e.target.value)}
                style={{colorScheme:"dark",width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.accent,fontSize:16,fontFamily:"monospace",outline:"none"}}/>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:6}}>ВРЕМЯ</div>
              <input type="time" value={planTime}
                onChange={e=>setPlanTime(e.target.value)}
                style={{colorScheme:"dark",width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.accent,fontSize:16,fontFamily:"monospace",outline:"none"}}/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn full onClick={()=>setShowDatePicker(false)} style={{flex:1}}>ОТМЕНА</Btn>
              <Btn accent full onClick={confirmSaveWorkoutPlan} style={{flex:2}}>✓ СОХРАНИТЬ</Btn>
            </div>
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <button onClick={()=>setAnswer(null)}
          style={{flex:1,background:"none",border:`0.5px solid ${C.accent}`,borderRadius:8,padding:"8px 16px",color:C.accent,fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>
          + ЕЩЁ ВОПРОС
        </button>
        {saved&&<button onClick={()=>onNav&&onNav("my_workouts")}
          style={{flex:1,background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px 16px",color:C.text,fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>
          ОТКРЫТЬ РАСПИСАНИЕ →
        </button>}
      </div>
    </Card>}
  </div>;
}

// ─── FOOD VISION ─────────────────────────────────────────────────────────────



function FoodVisionScreen({tgId,onBack,mealType}){
  const [photo,setPhoto]=useState(null);
  const [preview,setPreview]=useState(null);
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [saved,setSaved]=useState(false);
  const [error,setError]=useState(null);
  const inputRef=useRef(null);

  function handleFile(file){
    if(!file)return;
    setPreview(URL.createObjectURL(file));
    setResult(null);setSaved(false);setError(null);
    const reader=new FileReader();
    reader.onload=e=>setPhoto(e.target.result.split(",")[1]);
    reader.readAsDataURL(file);
  }

  async function analyze(){
    if(!photo)return;
    setLoading(true);setError(null);
    try{
      const res=await fetch(`${API}/food/analyze`,{method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({image_base64:photo,tg_id:tgId,save:false})});
      if(!res.ok)throw new Error(res.status);
      setResult(await res.json());
    }catch{setError("Не удалось распознать. Попробуй другое фото.");}
    finally{setLoading(false);}
  }

  async function saveToLog(){
    if(!photo||!result)return;
    setLoading(true);
    try{
      await fetch(`${API}/food/analyze`,{method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({image_base64:photo,tg_id:tgId,save:true,meal_type:mealType||null})});
      setSaved(true);
    }catch{}finally{setLoading(false);}
  }

  const confColor={"high":C.success,"medium":C.warn,"low":C.danger};
  const confLabel={"high":"✅ Высокая","medium":"⚠️ Средняя","low":"❓ Низкая"};

  return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={onBack}/>
      <Kicker>AI ПИТАНИЕ</Kicker>
      <Hero>ФОТО → КБЖУ</Hero>
      <div style={{color:C.muted,fontSize:13,marginTop:4,marginBottom:20}}>Сфотографируй еду — AI определит калории и БЖУ</div>
      <input ref={inputRef} type="file" accept="image/*"
        onChange={e=>handleFile(e.target.files[0])} style={{display:"none"}}/>
      {!preview?(
        <div onClick={()=>inputRef.current?.click()}
          style={{border:`2px dashed ${C.border}`,borderRadius:16,padding:"48px 20px",
            textAlign:"center",cursor:"pointer",marginBottom:16}}>
          <div style={{fontSize:52,marginBottom:10}}>📷</div>
          <Btn accent full style={{pointerEvents:"none",fontSize:15}}>ДОБАВИТЬ ФОТО</Btn>
        </div>
      ):(
        <div style={{marginBottom:16}}>
          <img src={preview} alt="food" style={{width:"100%",borderRadius:12,maxHeight:240,objectFit:"cover",marginBottom:10}}/>
          <div style={{display:"flex",gap:8}}>
            <Btn full onClick={()=>inputRef.current?.click()} style={{flex:1}}>📷 Другое</Btn>
            {!result&&!loading&&<Btn accent full onClick={analyze} style={{flex:2}}>🔍 АНАЛИЗИРОВАТЬ</Btn>}
          </div>
        </div>
      )}
      {loading&&<Card><div style={{textAlign:"center",padding:"16px 0",color:C.accent,fontFamily:"monospace",fontSize:12,letterSpacing:2}}>AI АНАЛИЗИРУЕТ ФОТО...</div></Card>}
      {error&&<Card><div style={{color:C.danger,fontSize:13,textAlign:"center",padding:"8px 0"}}>{error}</div></Card>}
      {result&&!loading&&(
        <Fragment>
          <Card accent style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:C.text}}>{result.dish_name}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:2}}>~{result.weight_g} г</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:24,fontWeight:700,color:C.accent}}>{result.calories}</div>
                <div style={{fontSize:11,color:C.muted}}>ккал</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
              {[{l:"БЕЛКИ",v:result.protein_g},{l:"ЖИРЫ",v:result.fat_g},{l:"УГЛЕВОДЫ",v:result.carbs_g}].map((m,i)=>(
                <div key={i} style={{textAlign:"center",background:C.bg,borderRadius:8,padding:"8px 4px"}}>
                  <div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>{m.l}</div>
                  <Mono size={15}>{m.v} г</Mono>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:confColor[result.confidence]||C.muted,fontFamily:"monospace"}}>
              ТОЧНОСТЬ: {confLabel[result.confidence]||result.confidence}
            </div>
            {result.note&&<div style={{fontSize:12,color:C.muted,marginTop:6}}>{result.note}</div>}
          </Card>
          {saved?(
            <div style={{background:"#00CC6622",border:`0.5px solid ${C.success}`,borderRadius:10,
              padding:"12px",fontSize:13,color:C.success,fontFamily:"monospace",textAlign:"center"}}>
              ✓ СОХРАНЕНО В ДНЕВНИК ПИТАНИЯ
            </div>
          ):(
            <div style={{display:"flex",gap:8}}>
              <Btn full onClick={()=>{setResult(null);setPreview(null);setPhoto(null);}} style={{flex:1}}>НОВОЕ ФОТО</Btn>
              <Btn accent full onClick={saveToLog} disabled={loading} style={{flex:2}}>
                {loading?"СОХРАНЯЕМ...":"💾 В ДНЕВНИК"}
              </Btn>
            </div>
          )}
        </Fragment>
      )}
    </div>
  );
}

// ─── NUTRITION ────────────────────────────────────────────────────────────────

function NutritionScreen({tgId,onBack,onNav}){
  const MEALS=[{type:"breakfast",label:t("meal_breakfast"),icon:"🌅"},{type:"lunch",label:t("meal_lunch"),icon:"☀️"},{type:"dinner",label:t("meal_dinner"),icon:"🌙"},{type:"snack",label:t("meal_snack"),icon:"🍎"}];
  const [data,setData]=useState(null);
  const [error,setError]=useState(null);
  const [viewDate,setViewDate]=useState(()=>new Date().toISOString().split("T")[0]);
  const [adding,setAdding]=useState(null);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({meal_name:"",kcal:"",protein:"",fat:"",carb:""});
  const [glasses,setGlasses]=useState(0);
  const [aiOpen,setAiOpen]=useState(false);
  const [aiQ,setAiQ]=useState("");
  const [aiAnswer,setAiAnswer]=useState(null);
  const [aiLoading,setAiLoading]=useState(false);
  const isToday=viewDate===new Date().toISOString().split("T")[0];

  // Норма воды: вес(кг) * 30мл / 250мл = стаканов (мин 6, макс 12)
  const waterGoal=data?.water_norm_glasses||8;

  function load(){
    if(!tgId)return;
    const url=isToday?`${API}/nutrition/${tgId}`:`${API}/nutrition/${tgId}/history?date=${viewDate}`;
    fetch(url).then(r=>r.json()).then(d=>{setData(d);const w=(d.today_logs||d.logs||[]).find(l=>l.meal_type==="water");setGlasses(w?.kcal||0);}).catch(()=>setError("Ошибка загрузки"));
  }
  useEffect(()=>{setData(null);load();},[viewDate]);

  async function askAI(){
    if(!aiQ.trim())return;
    setAiLoading(true);setAiAnswer(null);
    try{
      // Формируем контекст питания за день
      const logs=data?.today_logs||[];
      const totals=data?.today_totals||{};
      const logSummary=logs.filter(l=>l.meal_type!=="water").map(l=>`${l.meal_name}(${l.kcal}ккал Б${l.protein}г Ж${l.fat}г У${l.carb}г)`).join(", ");
      const nutritionCtx=logSummary?`\n\nПитание пользователя сегодня: ${logSummary}. Итого: ${totals.kcal||0}ккал, Б${totals.protein||0}г, Ж${totals.fat||0}г, У${totals.carb||0}г. Цель: ${data?.target_kcal||2000}ккал.`:"\n\nПользователь ещё ничего не ел сегодня.";
      const question=aiQ+nutritionCtx;
      const res=await fetch(`${API}/ai/ask`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tg_id:tgId,question})});
      const d=await res.json();
      if(res.status===429){setAiAnswer("⚠️ Лимит AI запросов на сегодня исчерпан");}
      else{setAiAnswer(d.answer||"Нет ответа");}
    }catch{setAiAnswer("Ошибка запроса");}
    finally{setAiLoading(false);}
  }

  const logs=data?.today_logs||data?.logs||[];
  const totals=data?.today_totals||data?.totals||{};
  function logsFor(type){return logs.filter(l=>l.meal_type===type);}
  function totalFor(type){const ls=logsFor(type);return{kcal:ls.reduce((s,l)=>s+(l.kcal||0),0),protein:ls.reduce((s,l)=>s+(l.protein||0),0),fat:ls.reduce((s,l)=>s+(l.fat||0),0),carb:ls.reduce((s,l)=>s+(l.carb||0),0)};}

  async function addMeal(){
    if(!form.meal_name.trim()||!form.kcal||!adding)return;
    setSaving(true);
    try{const res=await fetch(`${API}/nutrition/${tgId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({meal_name:form.meal_name,kcal:parseFloat(form.kcal)||0,protein:parseFloat(form.protein)||0,fat:parseFloat(form.fat)||0,carb:parseFloat(form.carb)||0,meal_type:adding})});if(res.ok){setAdding(null);setForm({meal_name:"",kcal:"",protein:"",fat:"",carb:""});setData(null);load();}}catch{}finally{setSaving(false);}
  }

  async function deleteLog(logId){if(!tgId||!logId)return;try{await fetch(`${API}/nutrition/${tgId}/${logId}`,{method:"DELETE"});setData(null);load();}catch{}}

  async function setWater(g){setGlasses(g);try{await fetch(`${API}/nutrition/${tgId}/water`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({glasses:g})});}catch{}}

  if(error)return<div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Card><div style={{color:C.danger,fontSize:13}}>{error}</div></Card></div>;
  if(!data)return<div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader text="ПИТАНИЕ"/></div>;

  const pct=Math.min(100,Math.round(((totals.kcal||0)/Math.max(data.target_kcal||2000,1))*100));

  return<div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>ПИТАНИЕ</Kicker><Hero>{t("nutrition_title")}</Hero>

    <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,marginBottom:16}}>
      <button onClick={()=>{const d=new Date(viewDate);d.setDate(d.getDate()-1);setViewDate(d.toISOString().split("T")[0]);}} style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"6px 14px",color:C.text,cursor:"pointer",fontSize:16}}>‹</button>
      <div style={{flex:1,textAlign:"center",fontFamily:"monospace",fontSize:12,color:isToday?C.accent:C.muted}}>{isToday?"СЕГОДНЯ":new Date(viewDate+"T12:00:00").toLocaleDateString("ru",{day:"numeric",month:"short"})}</div>
      {!isToday&&<button onClick={()=>setViewDate(new Date().toISOString().split("T")[0])} style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"6px 14px",color:C.text,cursor:"pointer",fontSize:16}}>›</button>}
    </div>

    <Card accent style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8}}>
        <Mono>{totals.kcal||0} <span style={{fontSize:13,color:C.muted,fontWeight:400}}>ккал</span></Mono>
        <span style={{fontFamily:"monospace",fontSize:11,color:C.muted}}>цель {data.target_kcal||2000}</span>
      </div>
      <ProgressBar pct={pct}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:10}}>
        {[{l:"Б",v:totals.protein||0},{l:"Ж",v:totals.fat||0},{l:"У",v:totals.carb||0}].map((m,i)=><div key={i} style={{textAlign:"center"}}><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>{m.l} (г)</div><Mono size={13}>{Math.round(m.v)}</Mono></div>)}
      </div>
    </Card>

    <Card style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <Kicker>{t("water_label")}</Kicker>
        <span style={{fontFamily:"monospace",fontSize:11,color:C.muted}}>{glasses}/{waterGoal} стаканов · {waterGoal*250}мл</span>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:glasses===0&&isToday?8:0}}>
        {Array.from({length:waterGoal},(_,i)=>(
          <button key={i} onClick={()=>isToday&&setWater(i<glasses?i:i+1)}
            style={{width:36,height:36,borderRadius:8,
              border:`0.5px solid ${i<glasses?"rgba(0,180,255,0.5)":C.border}`,
              background:i<glasses?"rgba(0,180,255,0.25)":"rgba(0,180,255,0.05)",
              fontSize:16,cursor:isToday?"pointer":"default",
              color:i<glasses?"rgba(0,180,255,1)":"rgba(0,180,255,0.3)"}}>
            {i<glasses?"💧":"◯"}
          </button>
        ))}
      </div>
      {glasses===0&&isToday&&<div style={{fontSize:11,color:"rgba(0,180,255,0.5)",fontFamily:"monospace"}}>← нажми чтобы отметить стакан воды</div>}
    </Card>

    {MEALS.map(meal=>{
      const ml=logsFor(meal.type);const mt=totalFor(meal.type);
      return<Card key={meal.type} style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:ml.length>0?10:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>{meal.icon}</span>
            <div>
              <div style={{fontWeight:600,fontSize:14,color:C.text}}>{meal.label}</div>
              {ml.length>0&&<div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{mt.kcal} ккал · Б{Math.round(mt.protein)} Ж{Math.round(mt.fat)} У{Math.round(mt.carb)}</div>}
            </div>
          </div>
          {isToday&&<div style={{display:"flex",gap:6}}>
            <button onClick={()=>onNav&&onNav("food_vision",{meal_type:meal.type})} style={{background:"none",border:`0.5px solid ${C.border}`,borderRadius:8,padding:"5px 8px",color:C.muted,fontSize:13,cursor:"pointer"}}>📷</button>
            <button onClick={()=>onNav&&onNav("food_search",{meal_type:meal.type})} style={{background:"none",border:`0.5px solid ${C.border}`,borderRadius:8,padding:"5px 8px",color:C.muted,fontSize:13,cursor:"pointer"}}>🔍</button>
            <button onClick={()=>{setAdding(adding===meal.type?null:meal.type);setForm({meal_name:"",kcal:"",protein:"",fat:"",carb:""}); }} style={{background:adding===meal.type?"rgba(200,255,0,0.1)":"none",border:`0.5px solid ${adding===meal.type?C.accent:C.border}`,borderRadius:8,padding:"5px 10px",color:adding===meal.type?C.accent:C.muted,fontSize:12,cursor:"pointer"}}>{adding===meal.type?"✕":"+ добавить"}</button>
          </div>}
        </div>
        {ml.map(l=>(
          <div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:`0.5px solid ${C.border}`}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,color:C.text}}>{l.meal_name}</div>
              <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginTop:2}}>Б{l.protein}г · Ж{l.fat}г · У{l.carb}г</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <Mono size={13}>{l.kcal} <span style={{fontSize:10,color:C.muted,fontWeight:400}}>ккал</span></Mono>
              {l.id&&isToday&&<button onClick={()=>deleteLog(l.id)} style={{background:"none",border:`0.5px solid ${C.danger}`,borderRadius:6,padding:"2px 7px",color:C.danger,fontSize:11,cursor:"pointer"}}>✕</button>}
            </div>
          </div>
        ))}
        {adding===meal.type&&isToday&&<div style={{marginTop:12,paddingTop:12,borderTop:`0.5px solid ${C.border}`}}>
          <input value={form.meal_name} onChange={e=>setForm(p=>({...p,meal_name:e.target.value}))} placeholder="Название блюда" style={{width:"100%",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",marginBottom:8}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:10}}>
            {[{k:"kcal",p:"Ккал"},{k:"protein",p:"Белки"},{k:"fat",p:"Жиры"},{k:"carb",p:"Углев"}].map(f=>(
              <input key={f.k} type="number" value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.p} style={{background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px 6px",color:C.text,fontSize:12,outline:"none",textAlign:"center"}}/>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn full onClick={()=>setAdding(null)} style={{flex:1}}>ОТМЕНА</Btn>
            <Btn accent full onClick={addMeal} disabled={saving||!form.meal_name.trim()||!form.kcal} style={{flex:2}}>{saving?"СОХРАНЯЕМ...":"ДОБАВИТЬ"}</Btn>
          </div>
        </div>}
      </Card>;
    })}

    {isToday&&<Card style={{marginBottom:12}}>
      <button onClick={()=>{setAiOpen(!aiOpen);setAiAnswer(null);setAiQ("");}}
        style={{width:"100%",background:"none",border:"none",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",padding:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20}}>💬</span>
          <div style={{fontWeight:600,fontSize:14,color:C.text,textAlign:"left"}}>{t("ask_trainer")}</div>
        </div>
        <span style={{color:C.accent,fontSize:16}}>{aiOpen?"∧":"∨"}</span>
      </button>
      {aiOpen&&<div style={{marginTop:12,paddingTop:12,borderTop:`0.5px solid ${C.border}`}}>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
          <VoiceRecorder tgId={tgId} disabled={aiLoading} onTranscribed={text=>setAiQ(prev=>prev?prev+" "+text:text)}/>
          <div style={{fontSize:11,color:C.muted}}>или напиши</div>
        </div>
        <textarea value={aiQ} onChange={e=>setAiQ(e.target.value)}
          placeholder="Например: что мне не хватает в питании сегодня? или как лучше распределить белки?"
          style={{width:"100%",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
            padding:"10px 12px",color:C.text,fontSize:13,outline:"none",resize:"none",
            minHeight:80,fontFamily:"inherit",boxSizing:"border-box",marginBottom:10}}/>
        <Btn accent full onClick={askAI} disabled={aiLoading||!aiQ.trim()}>
          {aiLoading?t("ai_thinking"):t("ai_ask")}
        </Btn>
        {aiAnswer&&<div style={{marginTop:12,padding:"12px 14px",background:C.bg,borderRadius:8,
          border:`0.5px solid ${C.border}`,fontSize:13,color:C.text,lineHeight:1.6,whiteSpace:"pre-wrap"}}>
          {aiAnswer}
        </div>}
      </div>}
    </Card>}
  </div>;
}



// ── FoodSearchScreen ─────────────────────────────────────────────────────────
function FoodSearchScreen({tgId,onBack,onNav,mealType}){
  const CATS=[
    {v:"",l:"Все"},
    {v:"meat",l:"🥩 Мясо"},{v:"fish",l:"🐟 Рыба"},{v:"dairy",l:"🥛 Молочка"},
    {v:"eggs",l:"🥚 Яйца"},{v:"grains",l:"🌾 Крупы"},{v:"bread",l:"🍞 Хлеб"},
    {v:"vegetables",l:"🥦 Овощи"},{v:"fruits",l:"🍎 Фрукты"},{v:"nuts",l:"🥜 Орехи"},
    {v:"drinks",l:"🧃 Напитки"},{v:"snacks",l:"🍫 Снеки"},{v:"other",l:"🫙 Прочее"},
    {v:"supplements",l:"💊 Спортпит"},
  ];
  const MEAL_OPTS=[
    {value:"breakfast",label:"Завтрак"},{value:"lunch",label:"Обед"},
    {value:"dinner",label:"Ужин"},{value:"snack",label:"Перекус"},
  ];
  const [q,setQ]=useState("");
  const [cat,setCat]=useState("");
  const [results,setResults]=useState([]);
  const [loading,setLoading]=useState(false);
  const [sel,setSel]=useState(null);
  const [weight,setWeight]=useState("100");
  const [meal,setMeal]=useState(mealType||"breakfast");
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const timerRef=useRef(null);

  useEffect(()=>{
    if(timerRef.current)clearTimeout(timerRef.current);
    if(!q.trim()&&!cat){setResults([]);return;}
    timerRef.current=setTimeout(()=>doSearch(q,cat),400);
    return()=>{if(timerRef.current)clearTimeout(timerRef.current);};
  },[q,cat]);

  async function doSearch(query,category){
    setLoading(true);
    try{
      const params=new URLSearchParams({limit:"30"});
      if(query.trim())params.append("q",query.trim());
      if(category)params.append("category",category);
      const r=await fetch(`${API}/food/search?${params}`);
      const d=await r.json();
      setResults(d.items||[]);
    }catch{}finally{setLoading(false);}
  }

  function calcKcal(p){
    const w=parseFloat(weight)||100;
    const f=w/100;
    return{
      kcal:Math.round((p.calories||0)*f),
      protein:Math.round((p.protein||0)*f*10)/10,
      fat:Math.round((p.fat||0)*f*10)/10,
      carb:Math.round((p.carbs||0)*f*10)/10,
    };
  }

  async function logProduct(){
    if(!sel||!tgId)return;
    const w=parseFloat(weight);
    if(!w||w<=0)return;
    setSaving(true);
    try{
      const r=await fetch(`${API}/food/log-from-catalog`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({user_id:tgId,product_id:sel.id,weight_g:w,meal_type:meal}),
      });
      if(r.ok){setSaved(true);setTimeout(()=>{if(onNav)onNav("nutrition",{});else onBack();},1200);}
    }catch{}finally{setSaving(false);}
  }

  if(sel){
    const calc=calcKcal(sel);
    return<div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={()=>setSel(null)}/>
      <Kicker>ДОБАВИТЬ ПРОДУКТ</Kicker>
      <Hero style={{marginBottom:16}}>{sel.name}</Hero>
      {sel.brand&&<div style={{fontFamily:"monospace",fontSize:11,color:C.muted,marginBottom:4}}>{sel.brand}</div>}
      {sel.supplement_type&&<Tag color={C.accent} style={{marginBottom:12}}>{sel.supplement_type}</Tag>}

      <Card accent style={{marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,textAlign:"center"}}>
          {[{l:"Ккал",v:calc.kcal},{l:"Белки",v:calc.protein+"г"},{l:"Жиры",v:calc.fat+"г"},{l:"Углев",v:calc.carb+"г"}].map((m,i)=>(
            <div key={i}><div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:2}}>{m.l}</div><Mono size={14}>{m.v}</Mono></div>
          ))}
        </div>
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",textAlign:"center",marginTop:8}}>на {weight}г</div>
      </Card>

      {sel.serving_size_g&&<div style={{fontFamily:"monospace",fontSize:11,color:C.muted,marginBottom:12}}>
        1 порция = {sel.serving_size_g}г
        {sel.servings_per_pack&&` · ${sel.servings_per_pack} порций в упаковке`}
      </div>}

      <div style={{marginBottom:12}}>
        <Kicker>ВЕС (г)</Kicker>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
          {(sel.serving_size_g?[sel.serving_size_g,100,200,300]:[50,100,150,200,300]).map(w=>(
            <button key={w} onClick={()=>setWeight(String(w))}
              style={{padding:"6px 14px",borderRadius:8,fontSize:12,cursor:"pointer",
                background:weight===String(w)?C.accent:C.card,
                border:`0.5px solid ${weight===String(w)?C.accent:C.border}`,
                color:weight===String(w)?C.bg:C.text,fontFamily:"monospace"}}>
              {w===sel.serving_size_g?"1 порция":w+"г"}
            </button>
          ))}
        </div>
        <input type="number" value={weight} onChange={e=>setWeight(e.target.value)}
          style={{width:"100%",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
            padding:"10px 14px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box"}}/>
      </div>

      <div style={{marginBottom:20}}>
        <Kicker>ПРИЁМ ПИЩИ</Kicker>
        <Sel value={meal} onChange={setMeal} options={MEAL_OPTS}/>
      </div>

      {saved
        ?<div style={{textAlign:"center",color:C.accent,fontFamily:"monospace",fontSize:14,padding:20}}>✓ ДОБАВЛЕНО</div>
        :<Btn accent full onClick={logProduct} disabled={saving||!weight||parseFloat(weight)<=0}>
          {saving?"СОХРАНЯЕМ...":"ДОБАВИТЬ В ДНЕВНИК"}
        </Btn>
      }
    </div>;
  }

  return<div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/>
    <Kicker>ПИТАНИЕ</Kicker>
    <Hero style={{marginBottom:12}}>{t("food_search_title")}</Hero>

    <input value={q} onChange={e=>setQ(e.target.value)}
      placeholder={t("food_search_placeholder")}
      style={{width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:10,
        padding:"12px 16px",color:C.text,fontSize:14,outline:"none",
        boxSizing:"border-box",marginBottom:12}}/>

    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
      {CATS.map(c=>(
        <button key={c.v} onClick={()=>{setCat(c.v);if(!q.trim())doSearch("",c.v);}}
          style={{padding:"5px 12px",borderRadius:16,fontSize:12,cursor:"pointer",
            background:cat===c.v?C.accent:C.card,
            border:`0.5px solid ${cat===c.v?C.accent:C.border}`,
            color:cat===c.v?C.bg:C.muted,fontFamily:"monospace"}}>
          {c.l}
        </button>
      ))}
    </div>

    {loading&&<Loader text="ПОИСК"/>}

    {!loading&&results.length===0&&(q||cat)&&(
      <div style={{textAlign:"center",color:C.muted,fontFamily:"monospace",fontSize:12,padding:32}}>
        НИЧЕГО НЕ НАЙДЕНО
      </div>
    )}

    {!loading&&results.length===0&&!q&&!cat&&(
      <div style={{textAlign:"center",color:C.muted,fontFamily:"monospace",fontSize:12,padding:32}}>
        ВВЕДИТЕ НАЗВАНИЕ ИЛИ ВЫБЕРИТЕ КАТЕГОРИЮ
      </div>
    )}

    {results.map(p=>(
      <Card key={p.id} onClick={()=>{setSel(p);setWeight(p.serving_size_g?String(p.serving_size_g):"100");}} style={{marginBottom:10,cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,color:C.text,fontWeight:600,marginBottom:2}}>{p.name}</div>
            {p.brand&&<div style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>{p.brand}</div>}
            <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginTop:4}}>
              Б{p.protein}г · Ж{p.fat}г · У{p.carbs}г
            </div>
          </div>
          <div style={{flexShrink:0,textAlign:"right",marginLeft:12}}>
            <Mono size={15}>{p.calories}</Mono>
            <div style={{fontSize:10,color:C.muted}}>ккал/100г</div>
            {p.supplement_type&&<Tag color={C.accent} style={{marginTop:4,fontSize:10}}>{p.supplement_type}</Tag>}
          </div>
        </div>
      </Card>
    ))}

    <AddCustomProductForm onAdded={p=>{setSel(p);setWeight("100");}}/>
  </div>;
}

// ── Форма добавления пользовательского продукта ───────────────────────────────
// ── SportLogScreen ────────────────────────────────────────────────────────────
function SportLogScreen({tgId,onBack,initialSport=null}){
  const [sports,setSports]=useState([
    {v:"football",l:"⚽ Футбол"},{v:"volleyball",l:"🏐 Волейбол"},
    {v:"basketball",l:"🏀 Баскетбол"},{v:"table_tennis",l:"🏓 Настольный теннис"},
    {v:"padel",l:"🎾 Падел"},{v:"tennis",l:"🎾 Большой теннис"},{v:"yoga",l:"🧘 Йога"},
  ]);
  useEffect(()=>{
    fetch(`${API}/sport-types`).then(r=>r.json()).then(d=>{
      if(d.sport_types?.length)setSports(d.sport_types.map(s=>({v:s.code,l:s.name,met:s.met,track_distance:s.track_distance})));
    }).catch(()=>{});
  },[]);
  const SPORTS=sports;
  const [sport,setSport]=useState(initialSport||"football");
  const [duration,setDuration]=useState("60");
  const [intensity,setIntensity]=useState("medium");
  const [notes,setNotes]=useState("");
  const [date,setDate]=useState(()=>new Date().toISOString().split("T")[0]);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(null);

  async function save(){
    if(!duration||parseInt(duration)<=0)return;
    setSaving(true);
    try{
      const r=await fetch(`${API}/sport/${tgId}`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({sport_type:sport,duration_min:parseInt(duration),
          intensity,notes:notes.trim()||null,session_date:date}),
      });
      const d=await r.json();
      if(r.ok)setSaved(d.calories_burned);
    }catch{}finally{setSaving(false);}
  }

  if(saved!==null)return(
    <div style={{padding:"16px 16px 100px",textAlign:"center",paddingTop:60}}>
      <div style={{fontSize:52,marginBottom:16}}>{SPORTS.find(s=>s.v===sport)?.l.split(" ")[0]||"⚽"}</div>
      <Hero style={{textAlign:"center",marginBottom:8}}>ЗАПИСАНО</Hero>
      <div style={{color:C.muted,fontFamily:"monospace",fontSize:13,marginBottom:4}}>
        {SPORTS.find(s=>s.v===sport)?.l} · {duration} мин
      </div>
      {saved>0&&<div style={{color:C.accent,fontFamily:"monospace",fontSize:18,marginBottom:4}}>~{saved} ккал</div>}
      <div style={{color:C.success,fontSize:12,fontFamily:"monospace",marginBottom:24}}>+8 баллов</div>
      <div style={{display:"flex",gap:10}}>
        <Btn full onClick={()=>{setSaved(null);setNotes("");setDuration("60");}} style={{flex:1}}>ЕЩЁ ОДНО</Btn>
        <Btn accent full onClick={onBack} style={{flex:1}}>← НАЗАД</Btn>
      </div>
    </div>
  );

  return<div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/>
    <Kicker>ВИДЫ СПОРТА</Kicker>
    <Hero style={{marginBottom:16}}>{t("sport_record")}</Hero>

    <div style={{marginBottom:14}}>
      <Kicker>{t("sport_type_label")}</Kicker>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:6}}>
        {SPORTS.map(s=>(
          <button key={s.v} onClick={()=>setSport(s.v)}
            style={{padding:"8px 14px",borderRadius:20,fontSize:13,cursor:"pointer",
              background:sport===s.v?C.accent:C.card,
              border:`0.5px solid ${sport===s.v?C.accent:C.border}`,
              color:sport===s.v?C.bg:C.text,fontWeight:sport===s.v?700:400}}>
            {s.l}
          </button>
        ))}
      </div>
    </div>

    <div style={{marginBottom:14}}>
      <Kicker>{t("sport_duration")}</Kicker>
      <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
        {[30,45,60,90,120].map(d=>(
          <button key={d} onClick={()=>setDuration(String(d))}
            style={{padding:"6px 14px",borderRadius:8,fontSize:13,cursor:"pointer",
              background:duration===String(d)?C.accent:C.card,
              border:`0.5px solid ${duration===String(d)?C.accent:C.border}`,
              color:duration===String(d)?C.bg:C.text,fontFamily:"monospace"}}>
            {d}
          </button>
        ))}
        <input type="number" value={duration} onChange={e=>setDuration(e.target.value)}
          placeholder="Своё"
          style={{width:70,background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
            padding:"6px 10px",color:C.text,fontSize:13,outline:"none",textAlign:"center"}}/>
      </div>
    </div>

    <div style={{marginBottom:14}}>
      <Kicker>{t("sport_intensity")}</Kicker>
      <div style={{display:"flex",gap:8,marginTop:6}}>
        {[{v:"low",l:t("intensity_low")},{v:"medium",l:t("intensity_medium")},{v:"high",l:t("intensity_high")}].map(i=>(
          <button key={i.v} onClick={()=>setIntensity(i.v)}
            style={{flex:1,padding:"8px 6px",borderRadius:8,fontSize:12,cursor:"pointer",
              background:intensity===i.v?C.accent:C.card,
              border:`0.5px solid ${intensity===i.v?C.accent:C.border}`,
              color:intensity===i.v?C.bg:C.text,fontWeight:intensity===i.v?700:400}}>
            {i.l}
          </button>
        ))}
      </div>
    </div>

    <div style={{marginBottom:14}}>
      <Kicker>{t("sport_date")}</Kicker>
      <input type="date" value={date} onChange={e=>setDate(e.target.value)}
        style={{colorScheme:"dark",width:"100%",background:C.card,border:`0.5px solid ${C.border}`,
          borderRadius:8,padding:"10px 14px",color:C.accent,fontSize:14,
          fontFamily:"monospace",outline:"none",marginTop:6}}/>
    </div>

    <div style={{marginBottom:20}}>
      <Kicker>{t("sport_notes_opt")}</Kicker>
      <textarea value={notes} onChange={e=>setNotes(e.target.value)}
        placeholder="Счёт, партнёры, ощущения..."
        style={{width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,
          padding:"10px 12px",color:C.text,fontSize:13,outline:"none",resize:"none",
          minHeight:60,fontFamily:"inherit",boxSizing:"border-box",marginTop:6}}/>
    </div>

    <Btn accent full onClick={save} disabled={saving||!duration||parseInt(duration)<=0}>
      {saving?"СОХРАНЯЕМ...":"✓ ЗАПИСАТЬ ЗАНЯТИЕ"}
    </Btn>
  </div>;
}

// ── GamificationScreen ────────────────────────────────────────────────────────
function GamificationScreen({tgId,onBack,user}){
  const [data,setData]=useState(null);
  useEffect(()=>{
    if(!tgId){setData(null);return;}
    fetch(`${API}/gamification/${tgId}`).then(r=>r.json()).then(setData).catch(()=>setData(null));
  },[]);

  const rankColors={beginner:"#CD7F32",athlete:"#C0C0C0",champion:"#FFD700",legend:"#00FFFF"};
  const reasonLabels={
    workout_finished:"🏋️ Тренировка завершена",
    checkin:"✓ Чек-ин",
    sport_football:"⚽ Футбол",sport_volleyball:"🏐 Волейбол",sport_basketball:"🏀 Баскетбол",
    sport_table_tennis:"🏓 Настольный теннис",sport_padel:"🎾 Падел",
    sport_tennis:"🎾 Теннис",sport_yoga:"🧘 Йога",
  };

  if(!data)return<div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader text="СТАТУС"/></div>;

  const rankColor=rankColors[data.rank]||C.accent;

  return<div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/>
    <Kicker>ГЕЙМИФИКАЦИЯ</Kicker>
    <Hero style={{marginBottom:16}}>МОЙ СТАТУС</Hero>

    <Card style={{marginBottom:16,border:`0.5px solid ${rankColor}`,textAlign:"center",padding:"20px 16px"}}>
      <div style={{fontSize:48,marginBottom:8}}>{
        {beginner:"🥉",athlete:"🥈",champion:"🥇",legend:"💎"}[data.rank]||"🥉"
      }</div>
      <div style={{fontSize:22,fontWeight:700,color:rankColor,marginBottom:4}}>{data.rank_name}</div>
      <Mono size={32} color={rankColor}>{data.total_points}</Mono>
      <div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginTop:4}}>БАЛЛОВ</div>
      <div style={{fontSize:12,color:C.accent,fontFamily:"monospace",marginTop:8}}>
        AI запросов в день: {data.ai_limit}
      </div>
    </Card>

    {data.next_rank&&<Card style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <Kicker>ДО СЛЕДУЮЩЕГО РАНГА</Kicker>
        <span style={{fontFamily:"monospace",fontSize:11,color:C.muted}}>{data.pts_to_next} балл.</span>
      </div>
      <ProgressBar pct={data.progress_pct}/>
      <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginTop:6}}>
        Следующий: {
          {athlete:"🥈 Атлет",champion:"🥇 Чемпион",legend:"💎 Легенда"}[data.next_rank]
        } ({data.next_rank_pts} балл.)
      </div>
    </Card>}

    <Card style={{marginBottom:16}}>
      <Kicker>КАК ЗАРАБАТЫВАТЬ БАЛЛЫ</Kicker>
      <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>
        {[
          {icon:"🏋️",l:"Тренировка завершена",pts:10},
          {icon:"⚽",l:"Занятие спортом",pts:8},
          {icon:"✓",l:"Чек-ин",pts:5},
          {icon:"📷",l:"Питание внесено",pts:2},
        ].map((r,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",
            borderBottom:i<3?`0.5px solid ${C.border}`:"none"}}>
            <span style={{fontSize:13,color:C.text}}>{r.icon} {r.l}</span>
            <span style={{fontFamily:"monospace",fontSize:13,color:C.accent}}>+{r.pts}</span>
          </div>
        ))}
      </div>
    </Card>

    {data.recent_points?.length>0&&<Card>
      <Kicker>ПОСЛЕДНИЕ НАЧИСЛЕНИЯ</Kicker>
      <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4}}>
        {data.recent_points.slice(0,5).map((r,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"4px 0",
            borderBottom:i<4?`0.5px solid ${C.border}`:"none"}}>
            <span style={{color:C.muted}}>{reasonLabels[r.reason]||r.reason}</span>
            <span style={{color:C.accent,fontFamily:"monospace"}}>+{r.pts}</span>
          </div>
        ))}
      </div>
    </Card>}
  </div>;
}


// ── PlateauBlock — блок плато в ProgressScreen ───────────────────────────────
// ── ReferralScreen ────────────────────────────────────────────────────────────
function ReferralScreen({tgId,onBack}){
  const [data,setData]=useState(null);
  const [copied,setCopied]=useState(false);

  useEffect(()=>{
    if(!tgId)return;
    fetch(`${API}/referral/${tgId}`).then(r=>r.json()).then(setData).catch(()=>setData(null));
  },[]);

  function copyLink(){
    if(!data?.ref_link)return;
    navigator.clipboard?.writeText(data.ref_link).then(()=>{
      setCopied(true);setTimeout(()=>setCopied(false),2000);
    }).catch(()=>{
      // fallback для Telegram
      if(window.Telegram?.WebApp?.openLink)
        window.Telegram.WebApp.openLink(data.ref_link);
    });
  }

  function shareLink(){
    if(!data?.ref_link)return;
    const text=`Привет! Тренируюсь в GymBot — умный AI-тренер в Telegram. Присоединяйся по моей ссылке и получи бонусные баллы!
${data.ref_link}`;
    if(window.Telegram?.WebApp?.openTelegramLink)
      window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(data.ref_link)}&text=${encodeURIComponent(text)}`);
    else
      navigator.clipboard?.writeText(text);
  }

  if(!data)return<div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader text="ЗАГРУЗКА"/></div>;

  if(!data.enabled)return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={onBack}/>
      <Hero>{t("referral_title")}</Hero>
      <Card style={{marginTop:16,textAlign:"center"}}>
        <div style={{color:C.muted,fontSize:13,padding:"20px 0"}}>
          Реферальная программа временно недоступна
        </div>
      </Card>
    </div>
  );

  return<div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/>
    <Kicker>БОНУСНАЯ ПРОГРАММА</Kicker>
    <Hero style={{marginBottom:16}}>{t("referral_title")}</Hero>

    <Card accent style={{marginBottom:16,textAlign:"center",padding:"20px 16px"}}>
      <Kicker>{t("referral_your_code")}</Kicker>
      <div style={{fontSize:32,fontWeight:700,fontFamily:"monospace",color:C.accent,
        letterSpacing:4,margin:"8px 0"}}>{data.ref_code}</div>
      <div style={{fontSize:12,color:C.muted,marginBottom:12}}>{data.ref_link}</div>
      <div style={{display:"flex",gap:8}}>
        <Btn full onClick={copyLink} style={{flex:1}}>
          {copied?"✓ СКОПИРОВАНО":"📋 КОПИРОВАТЬ"}
        </Btn>
        <Btn accent full onClick={shareLink} style={{flex:1}}>📤 ПОДЕЛИТЬСЯ</Btn>
      </div>
    </Card>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
      <Card style={{textAlign:"center"}}>
        <Kicker>{t("referral_friends")}</Kicker>
        <Mono size={28}>{data.referrals_count}</Mono>
      </Card>
      <Card style={{textAlign:"center"}}>
        <Kicker>{t("referral_bonus")}</Kicker>
        <Mono size={28}>{data.bonus_per_referral}</Mono>
        <div style={{fontSize:11,color:C.muted}}>баллов</div>
      </Card>
    </div>

    <Card style={{marginBottom:16}}>
      <Kicker>КАК ЭТО РАБОТАЕТ</Kicker>
      <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:8}}>
        {[
          {n:"1",t:`Поделись ссылкой с другом`},
          {n:"2",t:`Друг регистрируется в GymBot`},
          {n:"3",t:`Ты получаешь ${data.bonus_per_referral} баллов`},
          {n:"4",t:`Друг получает бонус при старте`},
        ].map((s,i)=>(
          <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:C.accent,
              color:C.bg,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",
              justifyContent:"center",flexShrink:0}}>{s.n}</div>
            <div style={{fontSize:13,color:C.text,paddingTop:3}}>{s.t}</div>
          </div>
        ))}
      </div>
    </Card>

    {data.referrals?.length>0&&<Card>
      <Kicker>МОИ РЕФЕРАЛЫ ({data.referrals_count})</Kicker>
      <div style={{marginTop:8}}>
        {data.referrals.map((r,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",
            padding:"6px 0",borderBottom:i<data.referrals.length-1?`0.5px solid ${C.border}`:"none"}}>
            <span style={{fontSize:13,color:C.text}}>{r.name}{r.username?` @${r.username}`:""}</span>
            <span style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>
              {r.joined?new Date(r.joined).toLocaleDateString("ru",{day:"numeric",month:"short"}):"—"}
            </span>
          </div>
        ))}
      </div>
    </Card>}
  </div>;
}


// ── Экспорт ──────────────────────────────────────────────────────────────────
function FoodGuideScreen({onBack}){
  const [cats,setCats]=useState(null);const [sel,setSel]=useState(null);
  useEffect(()=>{fetch(`${API}/food-guide`).then(r=>r.json()).then(d=>setCats(d.categories||[])).catch(()=>setCats([]));},[]);
  if(sel)return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={()=>setSel(null)}/>
    <div style={{fontSize:40,marginBottom:8}}>{sel.emoji}</div>
    <Kicker>СПРАВОЧНИК ПРОДУКТОВ</Kicker><Hero>{sel.name}</Hero>
    <div style={{height:16}}/>
    <Card accent style={{marginBottom:10}}>
      <Kicker>КБЖУ НА 100Г</Kicker>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
        {[{l:"КАЛОРИИ",v:sel.kcal,u:"ккал"},{l:"БЕЛОК",v:sel.protein,u:"г"},{l:"ЖИРЫ",v:sel.fat,u:"г"},{l:"УГЛЕВОДЫ",v:sel.carb,u:"г"}].map((m,i)=><div key={i}><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>{m.l}</div><Mono size={14}>{m.v} <span style={{fontSize:11,color:C.muted,fontWeight:400}}>{m.u}</span></Mono></div>)}
      </div>
    </Card>
    {[{label:"⏰ КОГДА ЕСТЬ",value:sel.timing},{label:"💡 СОВЕТЫ",value:sel.tips},{label:"🏆 ЛУЧШИЕ ПРОДУКТЫ",value:sel.best},{label:"✅ СОЧЕТАЕТСЯ С",value:sel.combines},{label:"❌ НЕ СОЧЕТАТЬ",value:sel.avoid}].map((r,i)=><Card key={i} style={{marginBottom:8}}><Kicker>{r.label}</Kicker><div style={{fontSize:13,color:C.text,lineHeight:1.6,marginTop:4}}>{r.value}</div></Card>)}
  </div>;
  if(!cats)return <div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader/></div>;
  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>СПРАВОЧНИК</Kicker><Hero>КАТАЛОГ ПРОДУКТОВ</Hero>
    <div style={{height:16}}/>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {cats.map((c,i)=><Card key={i} onClick={()=>setSel(c)}>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <span style={{fontSize:32}}>{c.emoji}</span>
          <div style={{flex:1}}><div style={{fontWeight:600,fontSize:15,color:C.text}}>{c.name}</div><div style={{fontSize:11,color:C.muted,marginTop:2,fontFamily:"monospace"}}>{c.kcal} ккал · Б {c.protein}г · Ж {c.fat}г · У {c.carb}г</div></div>
          <span style={{color:C.accent,fontSize:16}}>→</span>
        </div>
      </Card>)}
    </div>
  </div>;
}

// ─── SUPPLEMENTS ──────────────────────────────────────────────────────────────
function SupplementsScreen({onBack,user}){
  const [sel,setSel]=useState(null);
  const supps=[
    {name:"Протеин",icon:"🥛",dose:"20–40г за приём",timing:"После тренировки или в любое время дня",
      tips:"Восполнение белка. Сывороточный — быстрый, казеин — медленный (на ночь).",
      evidence:"🟢 Высокий уровень доказательности",
      contraindications:["kidney_disease"],
      links:[{label:"Examine.com — Protein",url:"https://examine.com/supplements/protein-powder/"}]},
    {name:"Креатин моногидрат",icon:"⚡",dose:"3–5г/день",timing:"В любое время, ежедневно",
      tips:"Без загрузки. Результат через 2–4 недели. Запивай водой (250мл). Один из самых изученных препаратов.",
      evidence:"🟢 Высокий уровень доказательности",
      contraindications:["kidney_disease"],
      links:[{label:"Examine.com — Creatine",url:"https://examine.com/supplements/creatine/"}]},
    {name:"Омега-3",icon:"🐟",dose:"1–3г EPA+DHA/день",timing:"Во время еды",
      tips:"Противовоспалительный эффект, суставы, сердце. Смотри на содержание EPA+DHA, не общий жир рыбы.",
      evidence:"🟢 Высокий уровень доказательности",
      contraindications:["fish_oil"],
      links:[{label:"Examine.com — Omega-3",url:"https://examine.com/supplements/fish-oil/"}]},
    {name:"Витамин D3",icon:"☀️",dose:"2000–5000 МЕ/день",timing:"Утром с жирной едой",
      tips:"Иммунитет, тестостерон, кости. Принимать с K2 (100–200мкг) для правильного усвоения кальция.",
      evidence:"🟢 Высокий уровень доказательности",
      contraindications:[],
      links:[{label:"Examine.com — Vitamin D",url:"https://examine.com/supplements/vitamin-d/"}]},
    {name:"Магний",icon:"💊",dose:"200–400мг",timing:"Перед сном",
      tips:"Качество сна, мышечное восстановление, снижение стресса. Форма: глицинат или малат (не оксид — плохо усваивается).",
      evidence:"🟡 Умеренный уровень доказательности",
      contraindications:[],
      links:[{label:"Examine.com — Magnesium",url:"https://examine.com/supplements/magnesium/"}]},
    {name:"Кофеин",icon:"☕",dose:"3–6мг/кг веса",timing:"За 30–45 мин до тренировки",
      tips:"Повышает выносливость, силу и концентрацию. Не принимать после 15:00 — нарушает сон. Допуск развивается быстро.",
      evidence:"🟢 Высокий уровень доказательности",
      contraindications:["hypertension","heart_disease"],
      links:[{label:"Examine.com — Caffeine",url:"https://examine.com/supplements/caffeine/"}]},
    {name:"Цинк",icon:"🔩",dose:"15–30мг/день",timing:"Во время еды или перед сном",
      tips:"Иммунитет, тестостерон, восстановление. Не принимать вместе с кальцием — конкурируют за усвоение.",
      evidence:"🟡 Умеренный уровень доказательности",
      contraindications:[],
      links:[{label:"Examine.com — Zinc",url:"https://examine.com/supplements/zinc/"}]},
    {name:"Коллаген",icon:"🦴",dose:"10г/день",timing:"За 1 час до тренировки с витамином C",
      tips:"Суставы и связки. Необходим витамин C (100мг) для синтеза коллагена. Эффект накопительный — 8–12 недель.",
      evidence:"🟡 Умеренный уровень доказательности",
      contraindications:[],
      links:[{label:"Examine.com — Collagen",url:"https://examine.com/supplements/collagen/"}]},
  ];

  // Персонализация по профилю
  const userConditions=user?.medical_conditions||[];
  const userAllergies=user?.allergies||[];
  const weight=user?.weight;

  function getWarning(s){
    const w=[];
    if(s.contraindications.some(c=>userConditions.includes(c)))w.push("⚠️ Проконсультируйся с врачом — есть противопоказания");
    if(s.contraindications.some(c=>userAllergies.includes(c)))w.push("🚫 Возможна аллергическая реакция");
    return w;
  }
  function personalDose(s){
    if(s.name==="Кофеин"&&weight)return`${Math.round(3*weight)}–${Math.round(6*weight)}мг (${Math.round(3*weight/100)}–${Math.round(6*weight/100)} таб по 100мг)`;
    return s.dose;
  }

  if(sel){
    const warnings=getWarning(sel);
    return <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={()=>setSel(null)}/>
      <div style={{fontSize:40,marginBottom:8}}>{sel.icon}</div>
      <Kicker>СПОРТИВНЫЕ ДОБАВКИ</Kicker><Hero>{sel.name}</Hero>
      <div style={{marginTop:8,marginBottom:16,fontSize:12,color:C.muted,fontFamily:"monospace"}}>{sel.evidence}</div>
      {warnings.length>0&&warnings.map((w,i)=><div key={i} style={{background:"#FF444422",border:`0.5px solid ${C.danger}`,borderRadius:10,padding:"10px 14px",marginBottom:10,fontSize:13,color:C.danger}}>{w}</div>)}
      <Card accent style={{marginBottom:10}}>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:4}}>ДОЗА{weight?" (ТВОЙ ВЕС "+weight+"КГ)":""}</div><div style={{fontSize:14,color:C.accent,fontWeight:600}}>{personalDose(sel)}</div></div>
          <div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:4}}>КОГДА ПРИНИМАТЬ</div><div style={{fontSize:14,color:C.accent,fontWeight:600}}>{sel.timing}</div></div>
        </div>
      </Card>
      <Card style={{marginBottom:10}}><Kicker>ОПИСАНИЕ И СОВЕТЫ</Kicker><div style={{fontSize:14,color:C.text,lineHeight:1.6,marginTop:6}}>{sel.tips}</div></Card>
      {sel.links?.length>0&&<Card><Kicker>ИСТОЧНИКИ</Kicker><div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>{sel.links.map((l,i)=><button key={i} onClick={()=>{if(window.Telegram?.WebApp?.openLink)window.Telegram.WebApp.openLink(l.url);else window.open(l.url,'_blank');}} style={{background:"none",border:`0.5px solid ${C.accent}`,borderRadius:8,padding:"8px 12px",fontSize:13,color:C.accent,cursor:"pointer",display:"flex",alignItems:"center",gap:6,width:"100%",textAlign:"left"}}>🔗 {l.label}</button>)}</div></Card>}
    </div>;
  }

  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>СПРАВОЧНИК</Kicker><Hero>ДОБАВКИ</Hero>
    {user&&<div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginTop:6,marginBottom:8}}>ПРОФИЛЬ · {user.weight}кг · {user.fitness_level?.toUpperCase()}</div>}
    <div style={{background:"#FFB80015",border:`0.5px solid ${C.warn}`,borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:11,color:C.warn,lineHeight:1.6}}>
      ⚠️ Применение витаминов и добавок носит рекомендательный характер и не является медицинской рекомендацией. Перед применением проконсультируйтесь с врачом.
    </div>
    <div style={{height:4}}/>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {supps.map((s,i)=>{
        const warnings=getWarning(s);
        return <Card key={i} onClick={()=>setSel(s)}>
          <div style={{display:"flex",gap:14,alignItems:"center"}}>
            <span style={{fontSize:32}}>{s.icon}</span>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontWeight:600,fontSize:15,color:C.text}}>{s.name}</div>
                {warnings.length>0&&<span style={{fontSize:14}}>⚠️</span>}
              </div>
              <div style={{fontSize:11,color:C.muted,marginTop:2,fontFamily:"monospace"}}>{personalDose(s)}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:2}}>{s.evidence}</div>
            </div>
            <span style={{color:C.accent,fontSize:16}}>→</span>
          </div>
        </Card>;
      })}
    </div>
  </div>;
}

// ─── MEASUREMENTS / CHECKIN / LANGUAGE / SUPPORT / GOALS / REMINDERS ─────────
function MeasurementsScreen({onBack,tgId}){
  const [view,setView]=useState("add"); // "add" | "history"
  const [history,setHistory]=useState(null);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [form,setForm]=useState({waist:"",hips:"",chest:"",arm:"",thigh:""});
  const fields=[{key:"waist",label:"Талия"},{key:"hips",label:"Бёдра"},{key:"chest",label:"Грудь"},{key:"arm",label:"Рука (бицепс)"},{key:"thigh",label:"Бедро"}];

  useEffect(()=>{
    if(view==="history"&&!history){
      if(tgId)fetch(`${API}/measurements/${tgId}`).then(r=>r.json()).then(d=>setHistory(d.logs||[])).catch(()=>setHistory([]));
      else setHistory([]);
    }
  },[view]);

  async function save(){
    const data=Object.fromEntries(Object.entries(form).filter(([,v])=>v).map(([k,v])=>[k,parseFloat(v)]));
    if(!Object.keys(data).length)return;
    setSaving(true);
    try{
      const res=await fetch(`${API}/measurements/${tgId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      if(res.ok){setSaved(true);setForm({waist:"",hips:"",chest:"",arm:"",thigh:""});setHistory(null);setTimeout(()=>setSaved(false),3000);}
    }catch{}finally{setSaving(false);}
  }

  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>АНТРОПОМЕТРИЯ</Kicker><Hero>ЗАМЕРЫ ТЕЛА</Hero>
    <div style={{display:"flex",gap:0,margin:"16px 0",border:`0.5px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
      {[{id:"add",label:"ДОБАВИТЬ"},{id:"history",label:"ИСТОРИЯ"}].map(t=>(
        <button key={t.id} onClick={()=>setView(t.id)} style={{flex:1,padding:"10px",background:view===t.id?C.accent:C.card,border:"none",color:view===t.id?C.bg:C.muted,fontFamily:"monospace",fontSize:11,fontWeight:700,cursor:"pointer"}}>
          {t.label}
        </button>
      ))}
    </div>

    {view==="add"&&<>
      {saved&&<div style={{background:"#00CC6622",border:`0.5px solid ${C.success}`,borderRadius:10,padding:"10px 14px",marginBottom:12,fontFamily:"monospace",fontSize:12,color:C.success}}>✓ ЗАМЕРЫ СОХРАНЕНЫ</div>}
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
        {fields.map(f=><Card key={f.key}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:13,color:C.muted,fontFamily:"monospace",marginBottom:6}}>{f.label.toUpperCase()}</div>
              <input type="number" value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder="0"
                style={{background:"none",border:"none",color:C.accent,fontSize:22,fontFamily:"monospace",fontWeight:700,width:80,outline:"none"}}/>
            </div>
            <span style={{fontFamily:"monospace",fontSize:14,color:C.muted}}>см</span>
          </div>
        </Card>)}
      </div>
      <Btn accent full onClick={save} disabled={saving||!Object.values(form).some(v=>v)}>
        {saving?"СОХРАНЯЕМ...":"СОХРАНИТЬ ЗАМЕРЫ"}
      </Btn>
      <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",textAlign:"center",marginTop:8}}>Замеры хранятся в истории — можно отслеживать динамику</div>
    </>}

    {view==="history"&&(
      !history?<Loader text="ИСТОРИЯ"/>:
      history.length===0?<Card><div style={{textAlign:"center",padding:"16px 0",color:C.muted}}>Замеров пока нет</div></Card>:
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {history.map((h,i)=><Card key={i}>
          <Kicker>{new Date(h.logged_at||h.created_at).toLocaleDateString("ru",{day:"numeric",month:"long"})}</Kicker>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 16px",marginTop:8}}>
            {fields.map(f=>h[f.key]?<div key={f.key}>
              <span style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>{f.label}: </span>
              <Mono size={13}>{h[f.key]} <span style={{fontSize:11,color:C.muted,fontWeight:400}}>см</span></Mono>
            </div>:null)}
          </div>
        </Card>)}
      </div>
    )}
  </div>;
}

function CheckinScreen({onBack,tgId}){
  const [sent,setSent]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({weight:"",sleep_hours:"",energy:3,sleep:3,stress:3,motivation:3});
  const sliders=[{key:"energy",label:"Энергия",lo:"😴",hi:"⚡"},{key:"sleep",label:"Сон",lo:"😞",hi:"😴✨"},{key:"stress",label:"Стресс",lo:"😌",hi:"😤"},{key:"motivation",label:"Мотивация",lo:"😑",hi:"🔥"}];

  async function send(){
    setSaving(true);
    const body={...form,weight:parseFloat(form.weight)||null,sleep_hours:parseFloat(form.sleep_hours)||null};
    try{
      if(tgId){
        await fetch(`${API}/checkin/${tgId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      }
    }catch{}finally{setSaving(false);}
    setSent(true);
  }

  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/>
    <Kicker>ЕЖЕНЕДЕЛЬНЫЙ</Kicker><Hero>ЧЕК-ИН</Hero>
    <Card style={{marginBottom:16}}>
      <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>
        Заполняй раз в неделю — в воскресенье вечером или понедельник утром.<br/>
        <span style={{color:C.accent}}>AI тренер</span> учитывает твой чек-ин при составлении планов, ответах и советах.
      </div>
    </Card>
    <div style={{height:8}}/>
    {sent
      ?<Card accent><div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:32,color:C.accent}}>✓</div><div style={{fontFamily:"monospace",fontSize:13,color:C.accent,marginTop:8}}>ЧЕК-ИН СОХРАНЁН</div><div style={{fontSize:12,color:C.muted,marginTop:6}}>AI тренер получил обновлённые данные</div></div></Card>
      :<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <Card>
            <div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("weight_kg")}</div>
            <input type="number" step="0.1" value={form.weight} onChange={e=>setForm(p=>({...p,weight:e.target.value}))} placeholder="0.0"
              style={{background:"none",border:"none",color:C.accent,fontSize:26,fontFamily:"monospace",fontWeight:700,width:"100%",outline:"none"}}/>
          </Card>
          <Card>
            <div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginBottom:8}}>СОН (ЧАСОВ)</div>
            <input type="number" step="0.5" min="0" max="24" value={form.sleep_hours} onChange={e=>setForm(p=>({...p,sleep_hours:e.target.value}))} placeholder="7.5"
              style={{background:"none",border:"none",color:C.accent,fontSize:26,fontFamily:"monospace",fontWeight:700,width:"100%",outline:"none"}}/>
          </Card>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
          {sliders.map(s=>(
            <Card key={s.key}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:12,color:C.muted,fontFamily:"monospace"}}>{s.label.toUpperCase()}</span>
                <Mono size={14}>{form[s.key]}/5</Mono>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <span style={{fontSize:14}}>{s.lo}</span>
                <input type="range" min={1} max={5} value={form[s.key]} onChange={e=>setForm(p=>({...p,[s.key]:+e.target.value}))} style={{flex:1,accentColor:C.accent}}/>
                <span style={{fontSize:14}}>{s.hi}</span>
              </div>
            </Card>
          ))}
        </div>
        <Btn accent full onClick={send} disabled={saving}>{saving?"СОХРАНЯЕМ...":"ОТПРАВИТЬ ЧЕК-ИН"}</Btn>
      </>
    }
  </div>;
}

function LanguageScreen({tgId,user,onBack,onUserUpdated}){
  const [saving,setSaving]=useState(false);
  const langs=[{code:"ru",label:"🇷🇺 Русский"},{code:"en",label:"🇬🇧 English"},{code:"uz",label:"🇺🇿 O'zbek"},{code:"kz",label:"🇰🇿 Қазақша"}];
  async function setLang(code){setSaving(code);try{await fetch(`${API}/user/${tgId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({lang:code})});LANG_STORE.current=code;onUserUpdated&&onUserUpdated(code);setTimeout(onBack,500);}catch{}finally{setSaving(false);};}
  const cur=user?.lang||"ru";
  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>НАСТРОЙКИ</Kicker><Hero>ЯЗЫК</Hero><div style={{height:16}}/>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {langs.map(l=><Card key={l.code} onClick={()=>setLang(l.code)} accent={cur===l.code}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:16,color:C.text,fontWeight:cur===l.code?700:400}}>{l.label}</span>{cur===l.code&&<span style={{color:C.accent,fontFamily:"monospace",fontSize:12}}>✓ ТЕКУЩИЙ</span>}{saving===l.code&&<span style={{color:C.muted,fontFamily:"monospace",fontSize:11}}>...</span>}</div>
      </Card>)}
    </div>
  </div>;
}

function SupportScreen({onBack,tgId}){
  const [msg,setMsg]=useState("");
  const [sent,setSent]=useState(false);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState(null);

  async function send(){
    if(!msg.trim())return;
    setSaving(true);setError(null);
    try{
      const res=await fetch(`${API}/support`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({tg_id:tgId||0,message:msg.trim(),
          user_name:tg?.initDataUnsafe?.user?.first_name||"Mini App User",
          username:tg?.initDataUnsafe?.user?.username||""})
      });
      if(res.ok){setSent(true);}
      else{setError("Ошибка отправки. Попробуй позже.");}
    }catch{setError("Нет соединения. Попробуй позже.");}
    finally{setSaving(false);}
  }
  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>ОБРАТНАЯ СВЯЗЬ</Kicker><Hero>ПОДДЕРЖКА</Hero><div style={{height:16}}/>
    {sent?<Card accent><div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:32,color:C.accent}}>✓</div><div style={{fontFamily:"monospace",fontSize:13,color:C.accent,marginTop:8}}>ОТПРАВЛЕНО</div></div></Card>:<>
      <Card style={{marginBottom:16}}><div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginBottom:10}}>ОПИШИ ПРОБЛЕМУ ИЛИ ВОПРОС</div><textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Опишите ваше обращение, мы ответим в ближайшее время" rows={5} style={{width:"100%",background:"none",border:"none",color:C.text,fontSize:14,lineHeight:1.6,resize:"none",outline:"none",boxSizing:"border-box"}}/></Card>
      <Btn accent full onClick={send} disabled={saving||!msg.trim()}>
              {saving?"ОТПРАВЛЯЕМ...":"ОТПРАВИТЬ"}
            </Btn>
            {error&&<div style={{marginTop:10,fontSize:12,color:C.danger,fontFamily:"monospace",textAlign:"center"}}>{error}</div>}
    </>}
  </div>;
}

function GoalsScreen({tgId,onBack}){
  const [data,setData]=useState(null);const [adding,setAdding]=useState(false);const [form,setForm]=useState({description:"",target_value:"",unit:"кг",deadline:""});const [saving,setSaving]=useState(false);
  function load(){if(!tgId){setData({goals:[]});return;}fetch(`${API}/goals/${tgId}`).then(r=>r.json()).then(setData).catch(()=>setData({goals:[]}));}
  useEffect(()=>{load();},[]);
  async function add(){if(!form.description.trim())return;setSaving(true);try{const res=await fetch(`${API}/goals/${tgId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:form.description,target_value:parseFloat(form.target_value)||null,unit:form.unit||null,deadline:form.deadline||null,goal_type:"custom"})});if(res.ok){setAdding(false);setForm({description:"",target_value:"",unit:"кг",deadline:""});load();}}catch{}finally{setSaving(false);};}
  if(!data)return <div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader text="ЦЕЛИ"/></div>;
  const active=data.goals.filter(g=>!g.is_achieved);const done=data.goals.filter(g=>g.is_achieved);
  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>ПРОГРЕСС</Kicker><Hero>МОИ ЦЕЛИ</Hero><div style={{height:16}}/>
    {!adding?<Btn accent full onClick={()=>setAdding(true)} style={{marginBottom:16}}>+ ДОБАВИТЬ ЦЕЛЬ</Btn>:
    <Card style={{marginBottom:16}}><Kicker>НОВАЯ ЦЕЛЬ</Kicker><div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
      <input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Описание цели..." style={{background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:14,outline:"none"}}/>
      <div style={{display:"flex",gap:8}}>
        <input type="number" value={form.target_value} onChange={e=>setForm(p=>({...p,target_value:e.target.value}))} placeholder="Цель" style={{flex:2,background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.accent,fontSize:14,fontFamily:"monospace",outline:"none"}}/>
        <input value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))} placeholder="ед." style={{flex:1,background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.muted,fontSize:14,outline:"none"}}/>
      </div>
      <input type="date" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))} style={{colorScheme:"dark",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.muted,fontSize:13,outline:"none"}}/>
      <div style={{display:"flex",gap:8}}><Btn full onClick={()=>setAdding(false)} style={{flex:1}}>ОТМЕНА</Btn><Btn accent full onClick={add} disabled={saving||!form.description.trim()} style={{flex:2}}>{saving?"...":t("save_profile")}</Btn></div>
    </div></Card>}
    {active.length===0&&!adding&&<Card style={{marginBottom:12}}><div style={{textAlign:"center",padding:"16px 0",color:C.muted}}>Активных целей нет. Поставь первую!</div></Card>}
    {active.map(g=><Card key={g.id} style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{fontWeight:600,fontSize:14,color:C.text,flex:1}}>{g.description}</div><Mono size={12}>{g.pct}%</Mono></div>
      <div style={{marginBottom:6}}><ProgressBar pct={g.pct}/></div>
      <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>{g.current_value}/{g.target_value} {g.unit}</span>{g.days_left!=null&&<span style={{fontSize:11,color:g.days_left<7?C.danger:C.muted,fontFamily:"monospace"}}>{g.days_left} дн.</span>}</div>
    </Card>)}
    {done.length>0&&<><Kicker style={{marginTop:16}}>ДОСТИГНУТО</Kicker>{done.map(g=><Card key={g.id} style={{marginBottom:8,opacity:0.6}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:14,color:C.success}}>✓ {g.description}</span><Mono size={12} color={C.success}>100%</Mono></div></Card>)}</>}
  </div>;
}

function RemindersScreen({tgId,onBack,onNav}){
  const [data,setData]=useState(null);
  useEffect(()=>{if(!tgId){setData({reminders:[]});return;}fetch(`${API}/reminders/${tgId}`).then(r=>r.json()).then(setData).catch(()=>setData({reminders:[]}));},[]);
  const fmt=iso=>{const d=new Date(iso);return d.toLocaleString("ru",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});};
  if(!data)return <div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader/></div>;
  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>УВЕДОМЛЕНИЯ</Kicker><Hero>НАПОМИНАНИЯ</Hero><div style={{height:16}}/>
    <Card style={{marginBottom:16}}><div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>🔔 Бот напоминает за <span style={{color:C.accent}}>1 час</span> до тренировки.<br/>Плато-детектор проверяет каждое воскресенье в 10:30.</div></Card>
    <Kicker>БЛИЖАЙШИЕ ТРЕНИРОВКИ</Kicker>
    {data.reminders.length===0?<Card><div style={{textAlign:"center",padding:"16px 0"}}><div style={{color:C.muted,fontSize:14}}>Нет предстоящих тренировок</div><button onClick={()=>onNav("plan_workout")} style={{marginTop:10,background:"none",border:`0.5px solid ${C.accent}`,borderRadius:8,padding:"8px 16px",color:C.accent,fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>+ ЗАПЛАНИРОВАТЬ</button></div></Card>:
    <div style={{display:"flex",flexDirection:"column",gap:8}}>{data.reminders.map((r,i)=><Card key={i} onClick={()=>r.id&&onNav&&onNav("planned_detail",{pwId:r.id})} style={{cursor:r.id?"pointer":"default"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontWeight:600,fontSize:14,color:C.text,marginBottom:4}}>{r.title}</div>
            <div style={{fontSize:12,color:C.accent,fontFamily:"monospace"}}>🔔 {fmt(r.dt)}</div>
          </div>
          {r.id&&<span style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>→</span>}
        </div>
      </Card>)}</div>}
  </div>;
}


export default function App(){
  function getNav(){const s=window.history.state;return s&&s._g?s:{_g:true,tab:"menu",screen:null,params:{}};}
  const [nav,setNav]=useState(getNav);
  const {tab,screen,params={}}=nav;

  const [user,setUser]=useState(null);
  const [lang,setLang]=useState("ru"); // триггер перерисовки при смене языка
  const [workouts,setWorkouts]=useState(null);
  const [stats,setStats]=useState(null);
  const [exercises,setExercises]=useState(null);
  const [muscleGroups,setMuscleGroups]=useState(null);
  const [plannedRefresh,setPlannedRefresh]=useState(0);
  const [menuRefresh,setMenuRefresh]=useState(0);
  const tgId=tg?.initDataUnsafe?.user?.id;

  function push(tab,screen,params={}){const s={_g:true,tab,screen,params};window.history.pushState(s,"");setNav(s);}
  function replace(tab,screen,params={}){const s={_g:true,tab,screen,params};window.history.replaceState(s,"");setNav(s);}
  function loadUser(){
    if(tgId){
      fetch(`${API}/user/${tgId}`)
        .then(r=>{
          if(r.status===404){
            // Пользователь не найден в БД — новая регистрация через Mini App
            setUser({first_name:tg?.initDataUnsafe?.user?.first_name||"Атлет",ai_requests_today:0,_not_found:true});
            return null;
          }
          if(!r.ok) throw new Error(r.status);
          return r.json();
        })
        .then(d=>{if(d){setUser(d);LANG_STORE.current=d.lang||"ru";setLang(d.lang||"ru");}})
        .catch(()=>setUser({first_name:tg?.initDataUnsafe?.user?.first_name||"Атлет",ai_requests_today:0,_error:true}));
    } else {
      setUser({first_name:"Атлет",ai_requests_today:0});
    }
  }

  useEffect(()=>{
    tg?.ready();tg?.expand();
    // Обрабатываем deep link startapp=pw_ID
    const startParam = tg?.initDataUnsafe?.start_param || new URLSearchParams(window.location.search).get("startapp");
    if(startParam?.startsWith("pw_")){
      const pwId=parseInt(startParam.replace("pw_",""));
      if(pwId)setTimeout(()=>push("workout","planned_detail",{pwId}),500);
    }
    if(startParam?.startsWith("ref_")){
      const refCode=startParam.replace("ref_","");
      if(refCode)sessionStorage.setItem("gymbot_ref_code",refCode);
    }
    // Инжектируем CSS для date/time пикеров в тёмной теме
    if(!document.getElementById("gymbot-datepicker-style")){
      const s=document.createElement("style");s.id="gymbot-datepicker-style";
      s.textContent='input[type="date"],input[type="time"]{color-scheme:dark;} input[type="date"]::-webkit-calendar-picker-indicator,input[type="time"]::-webkit-calendar-picker-indicator{filter:invert(1) brightness(0.8) sepia(1) hue-rotate(60deg);cursor:pointer;}';
      document.head.appendChild(s);
    }
    loadUser();
    fetch(`${API}/exercises`).then(r=>r.json()).then(d=>{setExercises(d.exercises||[]);setMuscleGroups(d.muscle_groups||[]);}).catch(()=>{setExercises([]);setMuscleGroups([]);});
    if(!window.history.state?._g)window.history.replaceState({_g:true,tab:"menu",screen:null,params:{}},"");
    function onPop(e){const s=e.state;if(s&&s._g){setNav(s);if(s.tab==="menu"&&!s.screen)setMenuRefresh(r=>r+1);}else{const h={_g:true,tab:"menu",screen:null,params:{}};window.history.replaceState(h,"");setNav(h);}}
    window.addEventListener("popstate",onPop);
    return()=>window.removeEventListener("popstate",onPop);
  },[]);

  useEffect(()=>{
    if(tab==="workout"&&!workouts){
      if(tgId){
      fetch(`${API}/workouts/${tgId}`).then(r=>r.json()).then(d=>{
        setWorkouts(d.workouts||[]);
        // Проверяем активную тренировку в БД
        const active=(d.workouts||[]).find(w=>w.status==="active");
        if(active&&!localStorage.getItem("gymbot_active_workout")){
          // Сохраняем в localStorage для показа баннера
          localStorage.setItem("gymbot_active_workout",JSON.stringify({
            workoutId:active.id,step:4,selExs:[],sets:{},curIdx:0,
            startTime:Date.now(),savedAt:Date.now(),
          }));
        }
      }).catch(()=>setWorkouts([]));
    }
      else setWorkouts([]); // без tgId показываем пустой список вместо вечного лоадера
    }
    if(tab==="progress"&&!stats){
      if(tgId)fetch(`${API}/stats/${tgId}`).then(r=>r.json()).then(setStats).catch(()=>setStats({}));
      else setStats({});
    }
  },[tab]);

  function handleTabChange(t){push(t,null,{});if(t==="menu")setMenuRefresh(r=>r+1);}
  function handleNav(s,p={}){
    if(s==="my_workouts"){push("workout",null,{});return;}
    push(tab,s,p);
  }
  const goBack=()=>window.history.back();

  function render(){
    const p=params||{};
    if(screen==="profile")return <ProfileScreen user={user} tgId={tgId} onBack={goBack} onUserUpdated={loadUser}/>;
    if(screen==="active_workout")return <ActiveWorkoutScreen tgId={tgId} exercises={exercises} muscleGroups={muscleGroups} onBack={goBack} onFinish={()=>setWorkouts(null)} onFinishNav={()=>{setPlannedRefresh(r=>r+1);replace("workout",null,{});if(tgId)fetch(`${API}/workouts/${tgId}`).then(r=>r.json()).then(d=>setWorkouts(d.workouts||[])).catch(()=>setWorkouts([]));}} onNav={handleNav} preselectedExIds={p.preselectedExIds||[]} plannedWorkoutId={p.plannedWorkoutId||null}/>;
    if(screen==="workout_detail")return <WorkoutDetailScreen workoutId={p.workoutId} tgId={tgId} onBack={goBack}/>;
    if(screen==="my_workouts_detail")return <MyWorkoutsDetailScreen tgId={tgId} onBack={goBack} onNav={handleNav}/>;
    if(screen==="planned_detail")return <PlannedDetailScreen pwId={p.pwId} tgId={tgId} onBack={goBack} exercises={exercises} muscleGroups={muscleGroups} readOnly={p.readOnly||false} onNav={handleNav}/>;
    if(screen==="plan_workout")return <PlanWorkoutScreen tgId={tgId} exercises={exercises} muscleGroups={muscleGroups} onBack={goBack}/>;
    if(screen==="goals")return <GoalsScreen tgId={tgId} onBack={goBack}/>;
    if(screen==="reminders")return <RemindersScreen tgId={tgId} onBack={goBack} onNav={handleNav}/>;
    if(screen==="food_vision")return <FoodVisionScreen tgId={tgId} onBack={goBack} mealType={p.meal_type}/>;
    if(screen==="sport_log")return <SportLogScreen tgId={tgId} onBack={goBack} initialSport={p.initial_sport||null}/>;
    if(screen==="referral")return <ReferralScreen tgId={tgId} onBack={goBack}/>;
    if(screen==="gamification")return <GamificationScreen tgId={tgId} onBack={goBack} user={user}/>;
    if(screen==="food_search")return <FoodSearchScreen tgId={tgId} onBack={goBack} onNav={handleNav} mealType={p.meal_type}/>;
    if(screen==="nutrition")return <NutritionScreen tgId={tgId} onBack={goBack} onNav={handleNav}/>;
    if(screen==="food_guide")return <FoodGuideScreen onBack={goBack}/>;
    if(screen==="measurements")return <MeasurementsScreen onBack={goBack} tgId={tgId}/>;
    if(screen==="checkin")return <CheckinScreen onBack={goBack} tgId={tgId}/>;
    if(screen==="supplements")return <SupplementsScreen onBack={goBack} user={user}/>;
    if(screen==="rest_timer")return <StandaloneTimer onBack={goBack}/>;
    if(screen==="language")return <LanguageScreen tgId={tgId} user={user} onBack={goBack} onUserUpdated={(code)=>{loadUser();if(code)setLang(code);}}/>;
    if(screen==="support")return <SupportScreen onBack={goBack} tgId={tgId}/>;
    if(tab==="menu")return <MenuScreen key={lang+"_"+menuRefresh} user={user} onNav={handleNav} activeWorkout={!!localStorage.getItem("gymbot_active_workout")}/>;
    if(tab==="workout")return <WorkoutHistoryScreen workouts={workouts} onNav={handleNav} tgId={tgId} refreshToken={plannedRefresh}/>;
    if(tab==="progress")return <ProgressScreen stats={stats} tgId={tgId}/>;
    if(tab==="catalog")return <CatalogScreen exercises={exercises} muscleGroups={muscleGroups}/>;
    if(tab==="ai")return <AIScreen user={user} tgId={tgId} onNav={handleNav} exercises={exercises}/>;
  }

  // Онбординг для новых пользователей
  if(user?._not_found)return<OnboardingScreen tgId={tgId} tgUser={tg?.initDataUnsafe?.user} onComplete={()=>{setUser(null);loadUser();}}/>;
  // Загрузка
  if(!user)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}><Loader text="ЗАГРУЗКА"/></div>;

  return <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
    {render()}
    <NavBar active={tab} onChange={handleTabChange}/>
  </div>;
}
