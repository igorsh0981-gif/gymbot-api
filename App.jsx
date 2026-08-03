import { useState, useEffect, useRef, Fragment } from "react";

const tg = window.Telegram?.WebApp;
const API = "https://web-production-4fe0b.up.railway.app/api";

// Автоматически прикрепляем подписанный Telegram initData ко всем запросам к своему API —
// бэкенд проверяет эту подпись и не доверяет просто tg_id из URL. Оборачиваем fetch один раз
// здесь, а не в каждом из сотен вызовов fetch() по всему файлу — гарантированно покрывает всё.
const _originalFetch = window.fetch.bind(window);
window.fetch = (url, options = {}) => {
  const urlStr = typeof url === "string" ? url : (url?.url || "");
  if (urlStr.startsWith(API) && tg?.initData) {
    const headers = { ...(options.headers || {}), "X-Telegram-Init-Data": tg.initData };
    return _originalFetch(url, { ...options, headers });
  }
  return _originalFetch(url, options);
};

// Показывать баннер "Продолжить тренировку" можно только если тренировка РЕАЛЬНО была начата
// (есть workoutId — вызов /api/workout/start на сервере уже произошёл). Простой факт наличия
// gymbot_active_workout в localStorage не годится: он появляется уже на этапе выбора упражнений,
// до нажатия "Начать" — иначе баннер показывается даже когда тренировка не начиналась вовсе.
function hasResumableActiveWorkout(){
  try{
    const raw=localStorage.getItem("gymbot_active_workout");
    if(!raw)return false;
    const data=JSON.parse(raw);
    return !!data?.workoutId;
  }catch{return false;}
}

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
    muscles_title:"ГРУППЫ МЫШЦ", exercises_title:"УПРАЖНЕНИЯ", replace_title:"ЗАМЕНА", show_all_exercises:"ПОКАЗАТЬ ВСЕ УПРАЖНЕНИЯ",
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
    goal_health:"Здоровье",
    goal_lose:"Похудение",
    goal_muscle:"Набор массы",
    goal_strength:"Сила",
    goal_endurance:"Выносливость",
    level_beginner:"Начинающий",
    level_intermediate:"Средний",
    level_advanced:"Продвинутый",
    difficulty_easy:"Лёгкое",
    difficulty_medium:"Среднее",
    difficulty_hard:"Сложное",
    gender_male:"Мужской",
    gender_female:"Женский",
    next_btn2:"ДАЛЕЕ →",
    back_to_menu:"← В МЕНЮ",
    search_placeholder:"ПОИСК...",
    enter_name:"Твоё имя",
    enter_goal:"КАКАЯ ТВОЯ ЦЕЛЬ?",
    hello_name:"ПРИВЕТ! КАК ТЕБЯ ЗОВУТ?",
    name_hint:"Имя будет отображаться в приложении",
    sets_label:"ПОДХОДОВ",
    reps_label2:"ПОВТОРЕНИЙ",
    exercises_label:"УПРАЖНЕНИЙ",
    minutes_label:"МИНУТ",
    tonnage_label2:"ТОННАЖ",
    volume_label:"ОБЪЁМ",
    weight_label2:"ВЕС",
    date_label:"ДАТА",
    time_label2:"ВРЕМЯ",
    difficulty_label:"СЛОЖНОСТЬ",
    equipment_label:"ОБОРУДОВАНИЕ",
    description_label:"ОПИСАНИЕ",
    technique_label:"ТЕХНИКА ВЫПОЛНЕНИЯ",
    more_info:"ПОДРОБНЕЕ →",
    open_plan:"ОТКРЫТЬ СОСТАВ →",
    continue_workout2:"ПРОДОЛЖИТЬ ТРЕНИРОВКУ",
    unfinished:"Незавершённая тренировка ждёт",
    skip_warmup:"ПРОПУСТИТЬ РАЗМИНКУ",
    warmup_time:"РЕКОМЕНДУЕМОЕ ВРЕМЯ РАЗМИНКИ",
    replace_exercise:"↔ ЗАМЕНА УПРАЖНЕНИЯ",
    do_replace:"↔ ЗАМЕНИТЬ",
    add_exercise:"+ ДОБАВИТЬ УПРАЖНЕНИЕ",
    add_during:"ДОБАВИТЬ УПРАЖНЕНИЕ",
    my_exercise:"СВОЁ УПРАЖНЕНИЕ",
    all_exercises:"ВСЕ УПРАЖНЕНИЯ →",
    show_exercises:"ПОКАЗАТЬ ВСЕ УПРАЖНЕНИЯ →",
    order_hint2:"↑↓ — перестановка · ↔ — замена",
    steps_1_4:"ШАГ 1 / 4",
    steps_2_4:"ШАГ 2 / 4",
    steps_3_4:"ШАГ 3 / 4",
    steps_4_4:"ШАГ 4 / 4",
    steps_1_2:"ШАГ 1 / 2",
    steps_2_2:"ШАГ 2 / 2",
    plan_step1:"ПЛАНИРОВАНИЕ · ШАГ 1",
    plan_step2:"ПЛАНИРОВАНИЕ · ШАГ 2",
    plan_step3:"ПЛАНИРОВАНИЕ · ШАГ 3",
    calories_label2:"КАЛОРИИ",
    proteins_label:"БЕЛКИ",
    fats_label:"ЖИРЫ",
    carbs_label:"УГЛЕВОДЫ",
    kcal_unit:"ккал",
    kcal_per100:"ккал/100г",
    protein_g:"Белки г",
    fat_g:"Жиры г",
    carb_g:"Углев г",
    weight_g:"Вес (кг)",
    portions_label:"ПРИЁМ ПИЩИ",
    add_meal2:"ДОБАВИТЬ В ДНЕВНИК",
    add_product:"ДОБАВИТЬ ПРОДУКТ",
    new_product:"НОВЫЙ ПРОДУКТ (КБЖУ на 100г)",
    product_catalog:"КАТАЛОГ ПРОДУКТОВ",
    food_catalog_title:"СПРАВОЧНИК ПРОДУКТОВ",
    food_catalog_kbju:"КБЖУ НА 100Г",
    search_product:"Поиск продукта...",
    product_name:"Название продукта *",
    dish_name:"Название блюда",
    add_custom_product:"+ ДОБАВИТЬ СВОЙ ПРОДУКТ",
    product_exists:"Продукт с таким названием уже существует",
    calories_short:"Ккал",
    calories_req:"Ккал *",
    carbs_short:"Углев",
    photo_kbju_title:"ФОТО → КБЖУ",
    photo_kbju_hint:"Сфотографируй еду — AI определит калории и БЖУ",
    analyzing_photo:"AI АНАЛИЗИРУЕТ ФОТО...",
    analyze_btn:"🔍 АНАЛИЗИРОВАТЬ",
    new_photo:"НОВОЕ ФОТО",
    add_to_diary2:"💾 В ДНЕВНИК",
    add_photo:"ДОБАВИТЬ ФОТО",
    ai_nutrition_title:"AI ПИТАНИЕ",
    saved_to_diary:"✓ СОХРАНЕНО В ДНЕВНИК ПИТАНИЯ",
    measurements_title2:"ЗАМЕРЫ ТЕЛА",
    measurements_cat:"АНТРОПОМЕТРИЯ",
    save_measurements:"СОХРАНИТЬ ЗАМЕРЫ",
    measurements_saved:"✓ ЗАМЕРЫ СОХРАНЕНЫ",
    measurements_history:"ИСТОРИЯ",
    measurements_add:"ДОБАВИТЬ",
    measurements_none:"Замеров пока нет",
    waist:"Талия",
    hips:"Бёдра",
    chest:"Грудь",
    arm:"Рука (бицепс)",
    thigh:"Бедро",
    checkin_title2:"ЧЕК-ИН",
    checkin_weekly:"ЕЖЕНЕДЕЛЬНЫЙ",
    checkin_saved:"ЧЕК-ИН СОХРАНЁН",
    send_checkin:"ОТПРАВИТЬ ЧЕК-ИН",
    checkin_ai_hint:"AI тренер получил обновлённые данные",
    sleep_hours:"СОН (ЧАСОВ)",
    energy_label:"Энергия",
    stress_label:"Стресс",
    motivation_label:"Мотивация",
    profile_fill:"Заполните профиль",
    profile_fill_hint:"Для персонализации тренировок заполните профиль",
    profile_edit:"✏ РЕДАКТИРОВАТЬ ПРОФИЛЬ",
    edit_date:"✏ ИЗМЕНИТЬ ДАТУ/СОСТАВ",
    age_label:"Возраст",
    age_years:"Возраст (лет)",
    height_label:"Рост",
    height_cm:"Рост (см)",
    bmi_label:"ИМТ",
    gender_label:"ПОЛ",
    ai_style_label:"СТИЛЬ ОБЩЕНИЯ AI",
    status_saved:"✓ СОХРАНЕНО",
    profile_saved2:"✓ ЗАМЕРЫ СОХРАНЕНЫ",
    ai_bro_desc:"Молодёжный, сленг, мотивация",
    ai_mentor_desc:"Умеренный, поддержка, советы",
    ai_expert_desc:"Профессиональный, термины",
    ai_bro_name:"Фитнес-бро",
    med_label:"МЕД. ПОКАЗАТЕЛИ / ПРОТИВОПОКАЗАНИЯ",
    no_med:"Нет противопоказаний",
    supps_label:"💊 МОИ ДОБАВКИ",
    quick_select:"БЫСТРЫЙ ВЫБОР",
    manual_input:"ИЛИ ВВЕДИ ВРУЧНУЮ",
    supp_name:"Название добавки...",
    supp_dose:"Дозировка (напр. 5г)",
    supp_timing:"Время (утром, до трен.)",
    not_specified2:"Не указаны",
    gamification_title2:"МОЙ СТАТУС",
    my_rating2:"МОЙ РЕЙТИНГ",
    status_label2:"СТАТУС",
    points_label2:"БАЛЛЫ",
    rank_label2:"УРОВЕНЬ",
    leaderboard_title:"ТАБЛИЦА ЛИДЕРОВ",
    my_position:"МОЯ ПОЗИЦИЯ",
    how_earn:"КАК ЗАРАБАТЫВАТЬ БАЛЛЫ",
    recent_points:"ПОСЛЕДНИЕ НАЧИСЛЕНИЯ",
    next_rank:"ДО СЛЕДУЮЩЕГО РАНГА",
    streak_series:"🔥 СЕРИЯ АКТИВНОСТИ",
    achievements_title2:"ДОСТИЖЕНИЯ",
    new_achievement:"🎉 НОВОЕ ДОСТИЖЕНИЕ",
    progress_label:"ПРОГРЕСС",
    unlocked_label:"ОТКРЫТО",
    referral_title2:"БОНУСНАЯ ПРОГРАММА",
    how_works:"КАК ЭТО РАБОТАЕТ",
    goals_title2:"МОИ ЦЕЛИ",
    goals_add:"+ ДОБАВИТЬ ЦЕЛЬ",
    new_goal:"НОВАЯ ЦЕЛЬ",
    goal_desc:"Описание цели...",
    goal_achieved:"ДОСТИГНУТО",
    no_goals:"Активных целей нет. Поставь первую!",
    goal_target:"Цель",
    goal_unit:"ед.",
    reminders_title2:"НАПОМИНАНИЯ",
    reminders_cat:"УВЕДОМЛЕНИЯ",
    upcoming_workouts:"БЛИЖАЙШИЕ ТРЕНИРОВКИ",
    no_reminders:"Нет предстоящих тренировок",
    bot_reminds:"🔔 Бот напоминает за",
    one_hour:"1 час",
    before_workout:"до тренировки",
    plateau_check:"Плато-детектор проверяет каждое воскресенье в 10:30.",
    add_plan:"+ ЗАПЛАНИРОВАТЬ",
    add_plan2:"+ ЗАПЛАНИРОВАТЬ ТРЕНИРОВКУ",
    support_title2:"ПОДДЕРЖКА",
    support_cat:"ОБРАТНАЯ СВЯЗЬ",
    support_placeholder:"Опишите ваше обращение, мы ответим в ближайшее время",
    support_problem:"ОПИШИ ПРОБЛЕМУ ИЛИ ВОПРОС",
    sending:"ОТПРАВЛЯЕМ...",
    sent:"ОТПРАВЛЕНО",
    send_btn:"ОТПРАВИТЬ",
    error_send:"Ошибка отправки. Попробуй позже.",
    error_conn:"Нет соединения. Проверь интернет.",
    error_conn2:"Нет соединения. Попробуй позже.",
    language_title2:"ЯЗЫК",
    settings_title:"НАСТРОЙКИ",
    current_lang:"✓ ТЕКУЩИЙ",
    sport_title2:"ВИДЫ СПОРТА",
    sport_cat:"СПОРТ",
    record_btn:"ЗАПИСАНО",
    sport_full_record:"Полная запись в разделе Тренировки → ⚽ Спорт",
    score_optional:"Счёт, партнёры, ощущения...",
    score_example:"Например: 3:2 или 21:18",
    sport_planned:"📤 ПОДЕЛИТЬСЯ",
    no_activities:"Нет занятий",
    ai_training:"AI ТРЕНЕР",
    greeting_back:"О,",
    greeting_back2:"ТЫ ВЕРНУЛСЯ",
    streak_day1:"ДЕНЬ",
    streak_day24:"ДНЯ",
    streak_days5:"ДНЕЙ",
    streak_podryad:"ПОДРЯД",
    ai_today:"AI сегодня",
    checkin_card_hint:"Заполняй раз в неделю — в воскресенье вечером или понедельник утром.",
    checkin_card_hint2:"учитывает твой чек-ин при составлении планов, ответах и советах.",
    level_below:"Ниже нач.",
    level_elite:"Элита",
    norm_beg:"Нач",
    norm_mid:"Ср",
    norm_adv:"Прод",
    norm_elite:"Элита",
    age_suffix:"л",
    coef_label:"коэф.",
    sleep_label2:"Сон",
    supp_timing_anytime:"В любое время, ежедневно",
    supp_timing_food:"Во время еды",
    supp_timing_food_sleep:"Во время еды или перед сном",
    supp_timing_before:"За 30–45 мин до тренировки",
    supp_timing_morning:"Утром с жирной едой",
    supp_timing_sleep:"Перед сном",
    supp_timing_collagen:"За 1 час до тренировки с витамином C",
    supp_protein:"Протеин",
    supp_creatine:"Креатин моногидрат",
    supp_omega:"Омега-3",
    supp_vitd:"Витамин D3",
    supp_magnesium:"Магний",
    supp_bcaa:"BCAA",
    supp_zinc:"Цинк",
    supp_vitc:"Витамин C",
    supp_multi:"Мультивитамины",
    supp_glutamine:"Глютамин",
    supp_collagen:"Коллаген",
    supp_melatonin:"Мелатонин",
    supp_caffeine:"Кофеин",
    supp_beta:"Бета-аланин",
    supp_preworkout:"Предтреник",
    add30s:"+30 сек",
    minus15s:"−15 сек",
    rest_5_10:"5–10 мин",
    sets_short2:"подх",
    reps_short2:"ПОВТ",
    pts_short:"балл.",
    pts_label:"баллов",
    kcal_short:"ккал",
    kcal_100g:"ккал/100г",
    volume_short:"объём (кг×повт)",
    workouts_week:"тренировок в неделю",
    one_session2:"1 тр-ка",
    max_w:"MAX ВЕС",
    dist_short:"ДИСТ. (КМ)",
    field_waist:"Талия",
    field_hips:"Бёдра",
    field_chest:"Грудь",
    field_arm:"Рука (бицепс)",
    field_thigh:"Бедро",
    field_age:"Возраст",
    field_age_y:"Возраст (лет)",
    field_weight_kg:"Вес (кг)",
    field_height_cm:"Рост (см)",
    step_1_2:"ШАГ 1 / 2",
    step_2_2:"ШАГ 2 / 2",
    step_1_4b:"ШАГ 1 / 4",
    step_2_4b:"ШАГ 2 / 4",
    step_3_4b:"ШАГ 3 / 4",
    step_4_4b:"ШАГ 4 / 4",
    plan_s1:"ПЛАНИРОВАНИЕ · ШАГ 1",
    plan_s2:"ПЛАНИРОВАНИЕ · ШАГ 2",
    plan_s3:"ПЛАНИРОВАНИЕ · ШАГ 3",
    sel_group_hint:"Выбери одну или несколько групп",
    next_datetime:"ДАЛЕЕ → ДАТА И ВРЕМЯ",
    choose_replacement:"ВЫБЕРИ ЗАМЕНУ",
    warmup_exec_hint:"Выполни разминку перед основной тренировкой",
    edit_btn:"ИЗМЕНИТЬ",
    edit_arrow:"ИЗМЕНИТЬ →",
    profile_section:"ПРОФИЛЬ",
    language_section:"ЯЗЫК",
    score_section:"СЧЁТ",
    notes_section:"ЗАМЕТКИ",
    cancel_btn2:"ОТМЕНА",
    delete_btn:"УДАЛИТЬ",
    error_label2:"ОШИБКА",
    failed_load2:"НЕ УДАЛОСЬ ЗАГРУЗИТЬ",
    points_short:"ПОДХОДОВ",
    order_section:"ПОРЯДОК",
    meal_section:"ПРИЁМ ПИЩИ",
    allergy_section:"АЛЛЕРГИИ",
    archive_section:"АРХИВ",
    goal_section:"ЦЕЛЬ",
    status_section:"СТАТУС",
    level_section:"УРОВЕНЬ",
    calories_section:"КАЛОРИИ",
    exercises_section:"УПРАЖНЕНИЯ",
    volume_section:"ОБЪЁМ",
    tonnage_section:"ТОННАЖ",
    time_min_section:"ВРЕМЯ (МИН)",
    name_section:"НАЗВАНИЕ",
    name_opt_section:"НАЗВАНИЕ (ОПЦИОНАЛЬНО)",
    food_catalog_section:"КАТАЛОГ ПРОДУКТОВ",
    food_ref_section:"СПРАВОЧНИК ПРОДУКТОВ",
    new_product_section:"НОВЫЙ ПРОДУКТ (КБЖУ на 100г)",
    add_product_btn:"ДОБАВИТЬ ПРОДУКТ",
    add_photo_btn:"ДОБАВИТЬ ФОТО",
    add_exercise_btn:"ДОБАВИТЬ УПРАЖНЕНИЕ",
    my_exercise_section:"СВОЁ УПРАЖНЕНИЕ",
    when_take_section:"КОГДА ПРИНИМАТЬ",
    photo_kbju_title2:"ФОТО → КБЖУ",
    ai_trainer_title:"AI ТРЕНЕР",
    ai_trainer_online:"ТРЕНЕР НА СВЯЗИ",
    analyzing_photo2:"AI АНАЛИЗИРУЕТ ФОТО...",
    workout_still_active:"⚠️ ТРЕНИРОВКА ЕЩЁ ВЫПОЛНЯЕТСЯ",
    record_sport:"⚽ ЗАПИСАТЬ ЗАНЯТИЕ",
    edit_date_plan:"✏ ИЗМЕНИТЬ ДАТУ/СОСТАВ",
    edit_profile_btn2:"✏ РЕДАКТИРОВАТЬ ПРОФИЛЬ",
    added_done:"✓ ДОБАВЛЕНО",
    warmup_done2:"✓ РАЗМИНКА ВЫПОЛНЕНА",
    save_confirm:"✓ СОХРАНИТЬ",
    workout_saved_tab:"✓ ТРЕНИРОВКА СОХРАНЕНА → вкладка Запланированные",
    calories_food:"🍽 КАЛОРИИ (ЕДА)",
    warmup_badge3:"🏃 РАЗМИНКА",
    when_workout2:"📅 КОГДА ТРЕНИРОВКА?",
    share_btn2:"📤 ПОДЕЛИТЬСЯ",
    other_photo2:"📷 Другое",
    analyze_btn2:"🔍 АНАЛИЗИРОВАТЬ",
    bot_reminds2:"🔔 Бот напоминает за",
    burned_sport:"🔥 ПОТРАЧЕНО (СПОРТ)",
    water_tap_hint:"← нажми чтобы отметить стакан воды",
    replace_exercise2:"↔ ЗАМЕНА УПРАЖНЕНИЯ",
    do_replace2:"↔ ЗАМЕНИТЬ",
    plateau_schedule:"Плато-детектор проверяет каждое воскресенье в 10:30.",
    bot_1h:"Бот напомнит за 1 час",
    bot_1h_full:"Бот напомнит за 1 час до тренировки",
    continue_workout3:"ПРОДОЛЖИТЬ ТРЕНИРОВКУ",
    skip_warmup2:"ПРОПУСТИТЬ РАЗМИНКУ",
    warmup_rec_time:"РЕКОМЕНДУЕМОЕ ВРЕМЯ РАЗМИНКИ",
    no_allergies2:"Нет аллергий",
    no_conditions2:"Нет противопоказаний",
    not_specified3:"Не указано",
    measurements_hint:"Замеры хранятся в истории — можно отслеживать динамику",
    ai_trainer_hint:"AI-тренер подстроит советы под неё",
    goal_hint:"КАКАЯ ТВОЯ ЦЕЛЬ?",
    name_hint2:"ПРИВЕТ! КАК ТЕБЯ ЗОВУТ?",
    requests_left:"ЗАПРОСОВ ОСТАЛОСЬ ·",
    or_write:"или напиши",
    pts_per:"до тренировки.",
    pts_bonus:"+8 баллов",
    no_data_short:"нет данных",
    day_30:"30 дней",
    day_60:"60 дней",
    day_90:"90 дней",
    day_180:"180 дней",
    hour_1:"1 час",
    ai_chat_title:"ДИАЛОГ С ТРЕНЕРОМ",
    ai_clear:"🗑 ОЧИСТИТЬ",
    ai_coach_label:"🤖 ТРЕНЕР",
    ai_thinking2:"ТРЕНЕР ДУМАЕТ...",
    ai_analyzing:"АНАЛИЗИРУЕТ ТРЕНИРОВКУ...",
    ai_review_title:"ОЦЕНКА AI ТРЕНЕРА",
    ai_coach_advice:"💬 СОВЕТ ТРЕНЕРА",
    ai_proposes:"💪 AI ПРЕДЛАГАЕТ ТРЕНИРОВКУ",
    ai_save_plan:"📅 СОХРАНИТЬ В РАСПИСАНИЕ",
    ai_date_hint:"Выбери дату и время перед сохранением",
    ai_saved:"✓ ТРЕНИРОВКА СОХРАНЕНА → вкладка Запланированные",
    open_schedule:"ОТКРЫТЬ РАСПИСАНИЕ →",
    continue_dialog:"+ ПРОДОЛЖИТЬ",
    quick_questions:"БЫСТРЫЕ ВОПРОСЫ",
    voice_hint:"🎙 ГОЛОС · ИЛИ НАПИШИ",
    voice_full_hint:"🎙 НАЖМИ ДЛЯ ЗАПИСИ ГОЛОСА · ИЛИ НАПИШИ",
    recognizing:"РАСПОЗНАЮ...",
    no_mic:"Нет доступа к микрофону",
    no_audio:"Нет данных аудио",
    speech_not_recognized:"Речь не распознана",
    transcription_error:"Ошибка транскрипции",
    progress_title2:"МОЙ ПРОГРЕСС",
    weekly_activity:"АКТИВНОСТЬ ПО НЕДЕЛЯМ",
    workouts_per_week:"тренировок в неделю",
    muscle_progress:"ПРОГРЕСС ПО ГРУППАМ МЫШЦ",
    strength_norms:"ТВОИ СИЛОВЫЕ VS НОРМЫ",
    no_data_period:"Нет данных за выбранный период",
    need_2_workouts:"Нужно ≥2 тренировок для графика",
    max_weight:"MAX ВЕС",
    volume_unit:"объём (кг×повт)",
    sessions_count:"тр-к",
    one_session:"тр-ка",
    weight_dynamics:"ДИНАМИКА ВЕСА",
    timer_title:"ТАЙМЕР ОТДЫХА",
    tools_title:"ИНСТРУМЕНТЫ",
    rest_done:"✓ ОТДЫХ ЗАВЕРШЁН",
    rest_label:"ОТДЫХ",
    choose_time:"ВЫБЕРИ ВРЕМЯ",
    pause_btn:"⏸ ПАУЗА",
    start_btn2:"▶ СТАРТ",
    add30:"+ 30 сек",
    minus15:"− 15 сек",
    reset_btn2:"СБРОС",
    supps_title2:"ДОБАВКИ",
    supps_cat:"СПОРТИВНЫЕ ДОБАВКИ",
    supps_ref:"СПРАВОЧНИК",
    supp_dose_label:"ДОЗА",
    supp_when:"КОГДА ПРИНИМАТЬ",
    supp_sources:"ИСТОЧНИКИ",
    supp_desc:"ОПИСАНИЕ И СОВЕТЫ",
    supp_warning:"⚠️ Применение витаминов и добавок носит рекомендательный характер.",
    food_guide_cat:"СПРАВОЧНИК",
    food_guide_title2:"КАТАЛОГ ПРОДУКТОВ",
    food_when:"⏰ КОГДА ЕСТЬ",
    food_tips:"💡 СОВЕТЫ",
    food_best:"🏆 ЛУЧШИЕ ПРОДУКТЫ",
    food_combines:"✅ СОЧЕТАЕТСЯ С",
    food_avoid:"❌ НЕ СОЧЕТАТЬ",
    error_server:"Ошибка сервера",
    error_save:"Ошибка сохранения",
    error_net:"Ошибка сети",
    error_request:"Ошибка запроса",
    error_launch:"Ошибка запуска",
    error_load:"Ошибка загрузки",
    error_try_again:"Ошибка. Попробуй ещё раз.",
    open_telegram:"Открой приложение через Telegram.",
    failed_load:"Не удалось загрузить",
    failed_recognize:"Не удалось распознать. Попробуй другое фото.",
    limit_exceeded:"Дневной лимит запросов исчерпан. Попробуй завтра.",
    specify_name:"Укажите название",
    specify_name_cal:"Укажите название и калории",
    delete_confirm:"Удалить занятие?",
    no_answer:"Нет ответа",
    another_one:"ЕЩЁ ОДНО",
    going_in:"ВХОДИМ...",
    exercises_none:"Упражнения не выбраны",
    exercises_none_planned:"Упражнения не были запланированы",
    my_workout_name:"Моя тренировка",
    workout_name_opt:"НАЗВАНИЕ (ОПЦИОНАЛЬНО)",
    workout_status_active:"⚠️ ТРЕНИРОВКА ЕЩЁ ВЫПОЛНЯЕТСЯ",
    scheduled_workout:"ЗАПЛАНИРОВАННАЯ ТРЕНИРОВКА",
    scheduled_done:"ЗАПЛАНИРОВАНО",
    my_workouts_title:"МОИ ТРЕНИРОВКИ",
    schedule_label:"РАСПИСАНИЕ",
    upcoming_label:"ПРЕДСТОЯЩИЕ",
    archive_planned:"АРХИВ ЗАПЛАНИРОВАННЫХ",
    search_exercise:"Поиск упражнения...",
    search_placeholder2:"Поиск...",
    name_label:"НАЗВАНИЕ",
    name_req:"Название *",
    exercise_group:"Группа мышц",
    sets_num:"Подходов",
    reps_num:"Повторений",
    all_btn:"ВСЕ",
    knowledge_base:"БАЗА ЗНАНИЙ",
    save_measurements2:"СОХРАНИТЬ ЗАМЕРЫ",
    saving:"СОХРАНЯЕМ...",
    saving2:"СОХРАНЯЮ...",
    saved2:"✓ СОХРАНЕНО",
    when_workout:"📅 КОГДА ТРЕНИРОВКА?",
    share_btn:"📤 ПОДЕЛИТЬСЯ",
    other_photo:"📷 Другое",
    warmup_badge2:"🏃 РАЗМИНКА",
    notifications_hint:"🔔 Бот напоминает за 1 час до тренировки.",
    not_found_hint:"Ничего не найдено",
    enter_name_or_cat:"ВВЕДИТЕ НАЗВАНИЕ ИЛИ ВЫБЕРИТЕ КАТЕГОРИЮ",
    calories_eaten:"🍽 КАЛОРИИ (ЕДА)",
    calories_burned2:"🔥 ПОТРАЧЕНО (СПОРТ)",
    trainer_bot:"Бот напомнит за 1 час",
    trainer_bot2:"Бот напомнит за 1 час до тренировки",
    conflict_time:"выбрать другое время?",
    dist_km:"ДИСТ. (КМ)",
    imt_label:"ИМТ",
    workout_done2:"Тренировка завершена",
    workout_type:"Тренировка",
    sets_short:"подх",
    reps_done:"выполнено",
    rpe_label:"RPE",
    warmup_duration:"5–10 мин",
    add_time30:"+30 сек",
    minus_time15:"−15 сек",
    no_sets_data:"нет данных",
    one_portion:"1 порция",
    portions_pack:"порций в упаковке",
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
    muscles_title:"MUSCLE GROUPS", exercises_title:"EXERCISES", replace_title:"REPLACE", show_all_exercises:"SHOW ALL EXERCISES",
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
    goal_health:"Health",
    goal_lose:"Weight Loss",
    goal_muscle:"Muscle Gain",
    goal_strength:"Strength",
    goal_endurance:"Endurance",
    level_beginner:"Beginner",
    level_intermediate:"Intermediate",
    level_advanced:"Advanced",
    difficulty_easy:"Easy",
    difficulty_medium:"Medium",
    difficulty_hard:"Hard",
    gender_male:"Male",
    gender_female:"Female",
    next_btn2:"NEXT →",
    back_to_menu:"← TO MENU",
    search_placeholder:"SEARCH...",
    enter_name:"Your name",
    enter_goal:"WHAT IS YOUR GOAL?",
    hello_name:"HI! WHAT IS YOUR NAME?",
    name_hint:"Your name will be shown in the app",
    sets_label:"SETS",
    reps_label2:"REPS",
    exercises_label:"EXERCISES",
    minutes_label:"MINUTES",
    tonnage_label2:"TONNAGE",
    volume_label:"VOLUME",
    weight_label2:"WEIGHT",
    date_label:"DATE",
    time_label2:"TIME",
    difficulty_label:"DIFFICULTY",
    equipment_label:"EQUIPMENT",
    description_label:"DESCRIPTION",
    technique_label:"TECHNIQUE",
    more_info:"MORE →",
    open_plan:"OPEN PLAN →",
    continue_workout2:"CONTINUE WORKOUT",
    unfinished:"You have an unfinished workout",
    skip_warmup:"SKIP WARM-UP",
    warmup_time:"RECOMMENDED WARM-UP TIME",
    replace_exercise:"↔ REPLACE EXERCISE",
    do_replace:"↔ REPLACE",
    add_exercise:"+ ADD EXERCISE",
    add_during:"ADD EXERCISE",
    my_exercise:"CUSTOM EXERCISE",
    all_exercises:"ALL EXERCISES →",
    show_exercises:"SHOW ALL EXERCISES →",
    order_hint2:"↑↓ — reorder · ↔ — replace",
    steps_1_4:"STEP 1 / 4",
    steps_2_4:"STEP 2 / 4",
    steps_3_4:"STEP 3 / 4",
    steps_4_4:"STEP 4 / 4",
    steps_1_2:"STEP 1 / 2",
    steps_2_2:"STEP 2 / 2",
    plan_step1:"PLANNING · STEP 1",
    plan_step2:"PLANNING · STEP 2",
    plan_step3:"PLANNING · STEP 3",
    calories_label2:"CALORIES",
    proteins_label:"PROTEINS",
    fats_label:"FATS",
    carbs_label:"CARBS",
    kcal_unit:"kcal",
    kcal_per100:"kcal/100g",
    protein_g:"Protein g",
    fat_g:"Fat g",
    carb_g:"Carbs g",
    weight_g:"Weight (kg)",
    portions_label:"MEAL",
    add_meal2:"ADD TO DIARY",
    add_product:"ADD PRODUCT",
    new_product:"NEW PRODUCT (per 100g)",
    product_catalog:"FOOD CATALOG",
    food_catalog_title:"FOOD REFERENCE",
    food_catalog_kbju:"PER 100G",
    search_product:"Search product...",
    product_name:"Product name *",
    dish_name:"Dish name",
    add_custom_product:"+ ADD CUSTOM PRODUCT",
    product_exists:"Product with this name already exists",
    calories_short:"Kcal",
    calories_req:"Kcal *",
    carbs_short:"Carbs",
    photo_kbju_title:"PHOTO → CALORIES",
    photo_kbju_hint:"Photo your food — AI will count calories and macros",
    analyzing_photo:"AI ANALYZING PHOTO...",
    analyze_btn:"🔍 ANALYZE",
    new_photo:"NEW PHOTO",
    add_to_diary2:"💾 TO DIARY",
    add_photo:"ADD PHOTO",
    ai_nutrition_title:"AI NUTRITION",
    saved_to_diary:"✓ SAVED TO NUTRITION DIARY",
    measurements_title2:"BODY MEASUREMENTS",
    measurements_cat:"ANTHROPOMETRY",
    save_measurements:"SAVE MEASUREMENTS",
    measurements_saved:"✓ MEASUREMENTS SAVED",
    measurements_history:"HISTORY",
    measurements_add:"ADD",
    measurements_none:"No measurements yet",
    waist:"Waist",
    hips:"Hips",
    chest:"Chest",
    arm:"Arm (bicep)",
    thigh:"Thigh",
    checkin_title2:"CHECK-IN",
    checkin_weekly:"WEEKLY",
    checkin_saved:"CHECK-IN SAVED",
    send_checkin:"SEND CHECK-IN",
    checkin_ai_hint:"AI coach received updated data",
    sleep_hours:"SLEEP (HOURS)",
    energy_label:"Energy",
    stress_label:"Stress",
    motivation_label:"Motivation",
    profile_fill:"Complete profile",
    profile_fill_hint:"Complete your profile to personalize workouts",
    profile_edit:"✏ EDIT PROFILE",
    edit_date:"✏ EDIT DATE/EXERCISES",
    age_label:"Age",
    age_years:"Age (years)",
    height_label:"Height",
    height_cm:"Height (cm)",
    bmi_label:"BMI",
    gender_label:"GENDER",
    ai_style_label:"AI COMMUNICATION STYLE",
    status_saved:"✓ SAVED",
    profile_saved2:"✓ MEASUREMENTS SAVED",
    ai_bro_desc:"Youth, slang, motivation",
    ai_mentor_desc:"Moderate, support, advice",
    ai_expert_desc:"Professional, terms",
    ai_bro_name:"Fitness Bro",
    med_label:"MEDICAL CONDITIONS",
    no_med:"No contraindications",
    supps_label:"💊 MY SUPPLEMENTS",
    quick_select:"QUICK SELECT",
    manual_input:"OR ENTER MANUALLY",
    supp_name:"Supplement name...",
    supp_dose:"Dosage (e.g. 5g)",
    supp_timing:"Timing (morning, pre-workout)",
    not_specified2:"Not specified",
    gamification_title2:"MY STATUS",
    my_rating2:"MY RATING",
    status_label2:"STATUS",
    points_label2:"POINTS",
    rank_label2:"RANK",
    leaderboard_title:"LEADERBOARD",
    my_position:"MY POSITION",
    how_earn:"HOW TO EARN POINTS",
    recent_points:"RECENT POINTS",
    next_rank:"TO NEXT RANK",
    streak_series:"🔥 ACTIVITY STREAK",
    achievements_title2:"ACHIEVEMENTS",
    new_achievement:"🎉 NEW ACHIEVEMENT",
    progress_label:"PROGRESS",
    unlocked_label:"UNLOCKED",
    referral_title2:"BONUS PROGRAM",
    how_works:"HOW IT WORKS",
    goals_title2:"MY GOALS",
    goals_add:"+ ADD GOAL",
    new_goal:"NEW GOAL",
    goal_desc:"Goal description...",
    goal_achieved:"ACHIEVED",
    no_goals:"No active goals. Set your first one!",
    goal_target:"Target",
    goal_unit:"unit",
    reminders_title2:"REMINDERS",
    reminders_cat:"NOTIFICATIONS",
    upcoming_workouts:"UPCOMING WORKOUTS",
    no_reminders:"No upcoming workouts",
    bot_reminds:"🔔 Bot reminds",
    one_hour:"1 hour",
    before_workout:"before workout",
    plateau_check:"Plateau detector runs every Sunday at 10:30.",
    add_plan:"+ SCHEDULE",
    add_plan2:"+ SCHEDULE WORKOUT",
    support_title2:"SUPPORT",
    support_cat:"FEEDBACK",
    support_placeholder:"Describe your issue, we will respond soon",
    support_problem:"DESCRIBE YOUR ISSUE",
    sending:"SENDING...",
    sent:"SENT",
    send_btn:"SEND",
    error_send:"Send error. Try later.",
    error_conn:"No connection. Check internet.",
    error_conn2:"No connection. Try later.",
    language_title2:"LANGUAGE",
    settings_title:"SETTINGS",
    current_lang:"✓ CURRENT",
    sport_title2:"SPORTS",
    sport_cat:"SPORT",
    record_btn:"RECORDED",
    sport_full_record:"Full log in Workouts → ⚽ Sport",
    score_optional:"Score, partners, feelings...",
    score_example:"E.g. 3:2 or 21:18",
    sport_planned:"📤 SHARE",
    no_activities:"No activities",
    ai_training:"AI COACH",
    greeting_back:"HEY,",
    greeting_back2:"WELCOME BACK",
    streak_day1:"DAY",
    streak_day24:"DAYS",
    streak_days5:"DAYS",
    streak_podryad:"IN A ROW",
    ai_today:"AI today",
    checkin_card_hint:"Fill in once a week — Sunday evening or Monday morning.",
    checkin_card_hint2:"uses your check-in when building plans, answers and advice.",
    level_below:"Below beg.",
    level_elite:"Elite",
    norm_beg:"Beg",
    norm_mid:"Int",
    norm_adv:"Adv",
    norm_elite:"Elite",
    age_suffix:"y",
    coef_label:"coef.",
    sleep_label2:"Sleep",
    supp_timing_anytime:"At any time daily",
    supp_timing_food:"With food",
    supp_timing_food_sleep:"With food or before sleep",
    supp_timing_before:"30–45 min before workout",
    supp_timing_morning:"Morning with fatty food",
    supp_timing_sleep:"Before sleep",
    supp_timing_collagen:"1 hour before workout with vitamin C",
    supp_protein:"Protein",
    supp_creatine:"Creatine Monohydrate",
    supp_omega:"Omega-3",
    supp_vitd:"Vitamin D3",
    supp_magnesium:"Magnesium",
    supp_bcaa:"BCAA",
    supp_zinc:"Zinc",
    supp_vitc:"Vitamin C",
    supp_multi:"Multivitamins",
    supp_glutamine:"Glutamine",
    supp_collagen:"Collagen",
    supp_melatonin:"Melatonin",
    supp_caffeine:"Caffeine",
    supp_beta:"Beta-Alanine",
    supp_preworkout:"Pre-workout",
    add30s:"+30 sec",
    minus15s:"−15 sec",
    rest_5_10:"5–10 min",
    sets_short2:"sets",
    reps_short2:"REPS",
    pts_short:"pts.",
    pts_label:"points",
    kcal_short:"kcal",
    kcal_100g:"kcal/100g",
    volume_short:"volume (kg×reps)",
    workouts_week:"workouts per week",
    one_session2:"1 session",
    max_w:"MAX WEIGHT",
    dist_short:"DIST. (KM)",
    field_waist:"Waist",
    field_hips:"Hips",
    field_chest:"Chest",
    field_arm:"Arm (bicep)",
    field_thigh:"Thigh",
    field_age:"Age",
    field_age_y:"Age (years)",
    field_weight_kg:"Weight (kg)",
    field_height_cm:"Height (cm)",
    step_1_2:"STEP 1 / 2",
    step_2_2:"STEP 2 / 2",
    step_1_4b:"STEP 1 / 4",
    step_2_4b:"STEP 2 / 4",
    step_3_4b:"STEP 3 / 4",
    step_4_4b:"STEP 4 / 4",
    plan_s1:"PLANNING · STEP 1",
    plan_s2:"PLANNING · STEP 2",
    plan_s3:"PLANNING · STEP 3",
    sel_group_hint:"Select one or more groups",
    next_datetime:"NEXT → DATE & TIME",
    choose_replacement:"CHOOSE REPLACEMENT",
    warmup_exec_hint:"Complete warm-up before main workout",
    edit_btn:"EDIT",
    edit_arrow:"EDIT →",
    profile_section:"PROFILE",
    language_section:"LANGUAGE",
    score_section:"SCORE",
    notes_section:"NOTES",
    cancel_btn2:"CANCEL",
    delete_btn:"DELETE",
    error_label2:"ERROR",
    failed_load2:"FAILED TO LOAD",
    points_short:"SETS",
    order_section:"ORDER",
    meal_section:"MEAL",
    allergy_section:"ALLERGIES",
    archive_section:"ARCHIVE",
    goal_section:"GOAL",
    status_section:"STATUS",
    level_section:"LEVEL",
    calories_section:"CALORIES",
    exercises_section:"EXERCISES",
    volume_section:"VOLUME",
    tonnage_section:"TONNAGE",
    time_min_section:"TIME (MIN)",
    name_section:"NAME",
    name_opt_section:"NAME (OPTIONAL)",
    food_catalog_section:"FOOD CATALOG",
    food_ref_section:"FOOD REFERENCE",
    new_product_section:"NEW PRODUCT (per 100g)",
    add_product_btn:"ADD PRODUCT",
    add_photo_btn:"ADD PHOTO",
    add_exercise_btn:"ADD EXERCISE",
    my_exercise_section:"CUSTOM EXERCISE",
    when_take_section:"WHEN TO TAKE",
    photo_kbju_title2:"PHOTO → CALORIES",
    ai_trainer_title:"AI COACH",
    ai_trainer_online:"COACH ONLINE",
    analyzing_photo2:"AI ANALYZING PHOTO...",
    workout_still_active:"⚠️ WORKOUT STILL IN PROGRESS",
    record_sport:"⚽ LOG ACTIVITY",
    edit_date_plan:"✏ EDIT DATE/EXERCISES",
    edit_profile_btn2:"✏ EDIT PROFILE",
    added_done:"✓ ADDED",
    warmup_done2:"✓ WARM-UP DONE",
    save_confirm:"✓ SAVE",
    workout_saved_tab:"✓ WORKOUT SAVED → Scheduled tab",
    calories_food:"🍽 CALORIES (FOOD)",
    warmup_badge3:"🏃 WARM-UP",
    when_workout2:"📅 WHEN IS THE WORKOUT?",
    share_btn2:"📤 SHARE",
    other_photo2:"📷 Other",
    analyze_btn2:"🔍 ANALYZE",
    bot_reminds2:"🔔 Bot reminds",
    burned_sport:"🔥 BURNED (SPORT)",
    water_tap_hint:"← tap to log a glass of water",
    replace_exercise2:"↔ REPLACE EXERCISE",
    do_replace2:"↔ REPLACE",
    plateau_schedule:"Plateau detector runs every Sunday at 10:30.",
    bot_1h:"Bot reminds 1 hour before",
    bot_1h_full:"Bot reminds 1 hour before workout",
    continue_workout3:"CONTINUE WORKOUT",
    skip_warmup2:"SKIP WARM-UP",
    warmup_rec_time:"RECOMMENDED WARM-UP TIME",
    no_allergies2:"No allergies",
    no_conditions2:"No contraindications",
    not_specified3:"Not specified",
    measurements_hint:"Measurements are saved in history — track your progress",
    ai_trainer_hint:"AI coach will tailor advice to your goal",
    goal_hint:"WHAT IS YOUR GOAL?",
    name_hint2:"HI! WHAT IS YOUR NAME?",
    requests_left:"REQUESTS LEFT ·",
    or_write:"or type",
    pts_per:"before workout.",
    pts_bonus:"+8 points",
    no_data_short:"no data",
    day_30:"30 days",
    day_60:"60 days",
    day_90:"90 days",
    day_180:"180 days",
    hour_1:"1 hour",
    ai_chat_title:"CHAT WITH COACH",
    ai_clear:"🗑 CLEAR",
    ai_coach_label:"🤖 COACH",
    ai_thinking2:"COACH THINKING...",
    ai_analyzing:"ANALYZING WORKOUT...",
    ai_review_title:"AI COACH REVIEW",
    ai_coach_advice:"💬 COACH ADVICE",
    ai_proposes:"💪 AI SUGGESTS WORKOUT",
    ai_save_plan:"📅 SAVE TO SCHEDULE",
    ai_date_hint:"Choose date and time before saving",
    ai_saved:"✓ WORKOUT SAVED → Scheduled tab",
    open_schedule:"OPEN SCHEDULE →",
    continue_dialog:"+ CONTINUE",
    quick_questions:"QUICK QUESTIONS",
    voice_hint:"🎙 VOICE · OR TYPE",
    voice_full_hint:"🎙 PRESS TO RECORD · OR TYPE",
    recognizing:"RECOGNIZING...",
    no_mic:"No microphone access",
    no_audio:"No audio data",
    speech_not_recognized:"Speech not recognized",
    transcription_error:"Transcription error",
    progress_title2:"MY PROGRESS",
    weekly_activity:"WEEKLY ACTIVITY",
    workouts_per_week:"workouts per week",
    muscle_progress:"PROGRESS BY MUSCLE GROUP",
    strength_norms:"YOUR STRENGTH VS NORMS",
    no_data_period:"No data for selected period",
    need_2_workouts:"Need ≥2 workouts for chart",
    max_weight:"MAX WEIGHT",
    volume_unit:"volume (kg×reps)",
    sessions_count:"sessions",
    one_session:"session",
    weight_dynamics:"WEIGHT DYNAMICS",
    timer_title:"REST TIMER",
    tools_title:"TOOLS",
    rest_done:"✓ REST COMPLETE",
    rest_label:"REST",
    choose_time:"CHOOSE TIME",
    pause_btn:"⏸ PAUSE",
    start_btn2:"▶ START",
    add30:"+30 sec",
    minus15:"−15 sec",
    reset_btn2:"RESET",
    supps_title2:"SUPPLEMENTS",
    supps_cat:"SPORTS SUPPLEMENTS",
    supps_ref:"REFERENCE",
    supp_dose_label:"DOSAGE",
    supp_when:"WHEN TO TAKE",
    supp_sources:"SOURCES",
    supp_desc:"DESCRIPTION & TIPS",
    supp_warning:"⚠️ Supplements are advisory, not medical advice.",
    food_guide_cat:"REFERENCE",
    food_guide_title2:"FOOD CATALOG",
    food_when:"⏰ WHEN TO EAT",
    food_tips:"💡 TIPS",
    food_best:"🏆 BEST PRODUCTS",
    food_combines:"✅ COMBINES WITH",
    food_avoid:"❌ DO NOT COMBINE",
    error_server:"Server error",
    error_save:"Save error",
    error_net:"Network error",
    error_request:"Request error",
    error_launch:"Launch error",
    error_load:"Load error",
    error_try_again:"Error. Try again.",
    open_telegram:"Open via Telegram.",
    failed_load:"Failed to load",
    failed_recognize:"Failed to recognize. Try another photo.",
    limit_exceeded:"Daily limit reached. Try tomorrow.",
    specify_name:"Enter name",
    specify_name_cal:"Enter name and calories",
    delete_confirm:"Delete activity?",
    no_answer:"No answer",
    another_one:"ONE MORE",
    going_in:"LOADING...",
    exercises_none:"No exercises selected",
    exercises_none_planned:"No exercises were planned",
    my_workout_name:"My workout",
    workout_name_opt:"NAME (OPTIONAL)",
    workout_status_active:"⚠️ WORKOUT STILL IN PROGRESS",
    scheduled_workout:"SCHEDULED WORKOUT",
    scheduled_done:"SCHEDULED",
    my_workouts_title:"MY WORKOUTS",
    schedule_label:"SCHEDULE",
    upcoming_label:"UPCOMING",
    archive_planned:"PLANNED ARCHIVE",
    search_exercise:"Search exercise...",
    search_placeholder2:"Search...",
    name_label:"NAME",
    name_req:"Name *",
    exercise_group:"Muscle group",
    sets_num:"Sets",
    reps_num:"Reps",
    all_btn:"ALL",
    knowledge_base:"KNOWLEDGE BASE",
    save_measurements2:"SAVE MEASUREMENTS",
    saving:"SAVING...",
    saving2:"SAVING...",
    saved2:"✓ SAVED",
    when_workout:"📅 WHEN IS THE WORKOUT?",
    share_btn:"📤 SHARE",
    other_photo:"📷 Other",
    warmup_badge2:"🏃 WARM-UP",
    notifications_hint:"🔔 Bot reminds 1 hour before workout.",
    not_found_hint:"Nothing found",
    enter_name_or_cat:"ENTER NAME OR SELECT CATEGORY",
    calories_eaten:"🍽 CALORIES (FOOD)",
    calories_burned2:"🔥 BURNED (SPORT)",
    trainer_bot:"Bot will remind 1 hour before",
    trainer_bot2:"Bot reminds 1 hour before workout",
    conflict_time:"choose another time?",
    dist_km:"DIST. (KM)",
    imt_label:"BMI",
    workout_done2:"Workout complete",
    workout_type:"Workout",
    sets_short:"sets",
    reps_done:"done",
    rpe_label:"RPE",
    warmup_duration:"5–10 min",
    add_time30:"+30 sec",
    minus_time15:"−15 sec",
    no_sets_data:"no data",
    one_portion:"1 serving",
    portions_pack:"servings per pack",
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
    muscles_title:"MUSHAK GURUHLARI", exercises_title:"MASHQLAR", replace_title:"ALMASHTIRISH", show_all_exercises:"BARCHA MASHQLARNI KO'RSATISH",
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
    goal_health:"Salomatlik",
    goal_lose:"Vazn yo'qotish",
    goal_muscle:"Mushak o'stirish",
    goal_strength:"Kuch",
    goal_endurance:"Chidamlilik",
    level_beginner:"Boshlang'ich",
    level_intermediate:"O'rta",
    level_advanced:"Ilg'or",
    difficulty_easy:"Oson",
    difficulty_medium:"O'rta",
    difficulty_hard:"Qiyin",
    gender_male:"Erkak",
    gender_female:"Ayol",
    next_btn2:"KEYINGI →",
    back_to_menu:"← MENYUGA",
    search_placeholder:"QIDIRISH...",
    enter_name:"Ismingiz",
    enter_goal:"MAQSADINGIZ NIMA?",
    hello_name:"SALOM! ISMINGIZ NIMA?",
    name_hint:"Ismingiz ilovada ko'rsatiladi",
    sets_label:"YONDASHUV",
    reps_label2:"MARTA",
    exercises_label:"MASHQLAR",
    minutes_label:"DAQIQA",
    tonnage_label2:"TONNAJ",
    volume_label:"HAJM",
    weight_label2:"OG'IRLIK",
    date_label:"SANA",
    time_label2:"VAQT",
    difficulty_label:"QIYINLIK",
    equipment_label:"JIHOZLAR",
    description_label:"TAVSIF",
    technique_label:"BAJARISH TEXNIKASI",
    more_info:"BATAFSIL →",
    open_plan:"TARKIBNI OCHISH →",
    continue_workout2:"MASHQNI DAVOM ETTIRISH",
    unfinished:"Tugallanmagan mashqingiz bor",
    skip_warmup:"ISITISHNI O'TKAZIB YUBORISH",
    warmup_time:"TAVSIYA ETILGAN ISITISH VAQTI",
    replace_exercise:"↔ MASHQNI ALMASHTIRISH",
    do_replace:"↔ ALMASHTIRISH",
    add_exercise:"+ MASHQ QO'SHISH",
    add_during:"MASHQ QO'SHISH",
    my_exercise:"O'Z MASHQIM",
    all_exercises:"BARCHA MASHQLAR →",
    show_exercises:"BARCHA MASHQLARNI KO'RSATISH →",
    order_hint2:"↑↓ — tartib · ↔ — almashtirish",
    steps_1_4:"QADAM 1 / 4",
    steps_2_4:"QADAM 2 / 4",
    steps_3_4:"QADAM 3 / 4",
    steps_4_4:"QADAM 4 / 4",
    steps_1_2:"QADAM 1 / 2",
    steps_2_2:"QADAM 2 / 2",
    plan_step1:"REJALASHTIRISH · QADAM 1",
    plan_step2:"REJALASHTIRISH · QADAM 2",
    plan_step3:"REJALASHTIRISH · QADAM 3",
    calories_label2:"KALORIYA",
    proteins_label:"OQSILLAR",
    fats_label:"YOG'LAR",
    carbs_label:"UGLEVODLAR",
    kcal_unit:"kkal",
    kcal_per100:"kkal/100g",
    protein_g:"Oqsil g",
    fat_g:"Yog' g",
    carb_g:"Uglevod g",
    weight_g:"Og'irlik (kg)",
    portions_label:"OVQAT TURI",
    add_meal2:"KUNDALIKKA QO'SHISH",
    add_product:"MAHSULOT QO'SHISH",
    new_product:"YANGI MAHSULOT (100g uchun)",
    product_catalog:"MAHSULOTLAR KATALOGI",
    food_catalog_title:"MAHSULOTLAR MA'LUMOTNOMAI",
    food_catalog_kbju:"100G UCHUN",
    search_product:"Mahsulot qidirish...",
    product_name:"Mahsulot nomi *",
    dish_name:"Taom nomi",
    add_custom_product:"+ O'Z MAHSULOTIMNI QO'SHISH",
    product_exists:"Bu nomli mahsulot allaqachon mavjud",
    calories_short:"Kkal",
    calories_req:"Kkal *",
    carbs_short:"Uglevod",
    photo_kbju_title:"FOTO → KALORIYA",
    photo_kbju_hint:"Ovqatni suratingiz — AI kaloriyalarni hisoblab beradi",
    analyzing_photo:"AI FOTONI TAHLIL QILMOQDA...",
    analyze_btn:"🔍 TAHLIL QILISH",
    new_photo:"YANGI FOTO",
    add_to_diary2:"💾 KUNDALIKKA",
    add_photo:"FOTO QO'SHISH",
    ai_nutrition_title:"AI OVQATLANISH",
    saved_to_diary:"✓ OVQATLANISH KUNDALIGIGA SAQLANDI",
    measurements_title2:"TANA O'LCHOVLARI",
    measurements_cat:"ANTROPOMETRIYA",
    save_measurements:"O'LCHOVLARNI SAQLASH",
    measurements_saved:"✓ O'LCHOVLAR SAQLANDI",
    measurements_history:"TARIX",
    measurements_add:"QO'SHISH",
    measurements_none:"Hali o'lchovlar yo'q",
    waist:"Bel",
    hips:"Tos",
    chest:"Ko'krak",
    arm:"Qo'l (biceps)",
    thigh:"Son",
    checkin_title2:"TEKSHIRUV",
    checkin_weekly:"HAFTALIK",
    checkin_saved:"TEKSHIRUV SAQLANDI",
    send_checkin:"TEKSHIRUVNI YUBORISH",
    checkin_ai_hint:"AI murabbiy yangilangan ma'lumotlarni oldi",
    sleep_hours:"UYQU (SOAT)",
    energy_label:"Energiya",
    stress_label:"Stress",
    motivation_label:"Motivatsiya",
    profile_fill:"Profilni to'ldiring",
    profile_fill_hint:"Mashqlarni moslash uchun profilni to'ldiring",
    profile_edit:"✏ PROFILNI TAHRIRLASH",
    edit_date:"✏ SANA/TARKIBNI O'ZGARTIRISH",
    age_label:"Yosh",
    age_years:"Yosh (yillar)",
    height_label:"Bo'y",
    height_cm:"Bo'y (sm)",
    bmi_label:"TKI",
    gender_label:"JINS",
    ai_style_label:"AI MULOQOT USLUBI",
    status_saved:"✓ SAQLANDI",
    profile_saved2:"✓ O'LCHOVLAR SAQLANDI",
    ai_bro_desc:"Yoshlar, sleng, motivatsiya",
    ai_mentor_desc:"O'rtacha, qo'llab-quvvatlash",
    ai_expert_desc:"Professional, atamalar",
    ai_bro_name:"Fitnes-bro",
    med_label:"TIBBIY KO'RSATMALAR",
    no_med:"Cheklovlar yo'q",
    supps_label:"💊 MENING QO'SHIMCHALARIM",
    quick_select:"TEZKOR TANLASH",
    manual_input:"YOKI QO'LDA KIRITING",
    supp_name:"Qo'shimcha nomi...",
    supp_dose:"Dozasi (masalan 5g)",
    supp_timing:"Vaqti (ertalab, mashqdan oldin)",
    not_specified2:"Ko'rsatilmagan",
    gamification_title2:"MENING STATUSIM",
    my_rating2:"MENING REYTINGIM",
    status_label2:"STATUS",
    points_label2:"BALLLAR",
    rank_label2:"DARAJA",
    leaderboard_title:"LIDERLAR JADVALI",
    my_position:"MENING O'RNIM",
    how_earn:"QANDAY BALL ISHLASH MUMKIN",
    recent_points:"SO'NGGI HISOBLASHLAR",
    next_rank:"KEYINGI DARAJAGA",
    streak_series:"🔥 FAOLLIK SERIYASI",
    achievements_title2:"YUTUQLAR",
    new_achievement:"🎉 YANGI YUTUQ",
    progress_label:"TARAQQIYOT",
    unlocked_label:"OCHILDI",
    referral_title2:"BONUS DASTURI",
    how_works:"QANDAY ISHLAYDI",
    goals_title2:"MENING MAQSADLARIM",
    goals_add:"+ MAQSAD QO'SHISH",
    new_goal:"YANGI MAQSAD",
    goal_desc:"Maqsad tavsifi...",
    goal_achieved:"ERISHILDI",
    no_goals:"Faol maqsadlar yo'q. Birinchisini qo'ying!",
    goal_target:"Maqsad",
    goal_unit:"birlik",
    reminders_title2:"ESLATMALAR",
    reminders_cat:"BILDIRISHNOMALAR",
    upcoming_workouts:"KELGUSI MASHQLAR",
    no_reminders:"Kelgusi mashqlar yo'q",
    bot_reminds:"🔔 Bot eslatadi",
    one_hour:"1 soat",
    before_workout:"mashqdan oldin",
    plateau_check:"Plato detektori har yakshanba 10:30 da tekshiradi.",
    add_plan:"+ REJALASHTIRISH",
    add_plan2:"+ MASHQNI REJALASHTIRISH",
    support_title2:"YORDAM",
    support_cat:"FIKR-MULOHAZA",
    support_placeholder:"Muammoingizni tasvirlab bering, tez javob beramiz",
    support_problem:"MUAMMO YOKI SAVOLNI TUSHUNTIRING",
    sending:"YUBORILMOQDA...",
    sent:"YUBORILDI",
    send_btn:"YUBORISH",
    error_send:"Yuborishda xato. Keyinroq urinib ko'ring.",
    error_conn:"Ulanish yo'q. Internetni tekshiring.",
    error_conn2:"Ulanish yo'q. Keyinroq urinib ko'ring.",
    language_title2:"TIL",
    settings_title:"SOZLAMALAR",
    current_lang:"✓ JORIY",
    sport_title2:"SPORT TURLARI",
    sport_cat:"SPORT",
    record_btn:"YOZILDI",
    sport_full_record:"To'liq yozuv Mashqlar → ⚽ Sport bo'limida",
    score_optional:"Natija, hamkorlar, his-tuyg'ular...",
    score_example:"Masalan: 3:2 yoki 21:18",
    sport_planned:"📤 ULASHISH",
    no_activities:"Mashg'ulotlar yo'q",
    ai_training:"AI MURABBIY",
    greeting_back:"SALOM,",
    greeting_back2:"XUSH KELIBSIZ",
    streak_day1:"KUN",
    streak_day24:"KUN",
    streak_days5:"KUN",
    streak_podryad:"KETMA-KET",
    ai_today:"AI bugun",
    checkin_card_hint:"Haftada bir marta — yakshanba kechasi yoki dushanba ertalab to'ldiring.",
    checkin_card_hint2:"reja, javob va maslahatlarda chek-iningizni hisobga oladi.",
    level_below:"Boshdan past",
    level_elite:"Elit",
    norm_beg:"Bosh",
    norm_mid:"O'rta",
    norm_adv:"Ilg'or",
    norm_elite:"Elit",
    age_suffix:"y",
    coef_label:"koef.",
    sleep_label2:"Uyqu",
    supp_timing_anytime:"Har kuni istalgan vaqtda",
    supp_timing_food:"Ovqat bilan",
    supp_timing_food_sleep:"Ovqat bilan yoki uxlashdan oldin",
    supp_timing_before:"Mashqdan 30–45 daqiqa oldin",
    supp_timing_morning:"Ertalab yog'li ovqat bilan",
    supp_timing_sleep:"Uxlashdan oldin",
    supp_timing_collagen:"Mashqdan 1 soat oldin C vitamini bilan",
    supp_protein:"Protein",
    supp_creatine:"Kreatin monogidrat",
    supp_omega:"Omega-3",
    supp_vitd:"D3 vitamini",
    supp_magnesium:"Magniy",
    supp_bcaa:"BCAA",
    supp_zinc:"Rux",
    supp_vitc:"C vitamini",
    supp_multi:"Multivitaminlar",
    supp_glutamine:"Glutamin",
    supp_collagen:"Kollagen",
    supp_melatonin:"Melatonin",
    supp_caffeine:"Kofein",
    supp_beta:"Beta-alanin",
    supp_preworkout:"Pre-workout",
    add30s:"+30 soniya",
    minus15s:"−15 soniya",
    rest_5_10:"5–10 daqiqa",
    sets_short2:"yondashuv",
    reps_short2:"MARTA",
    pts_short:"ball.",
    pts_label:"balllar",
    kcal_short:"kkal",
    kcal_100g:"kkal/100g",
    volume_short:"hajm (kg×marta)",
    workouts_week:"mashq haftada",
    one_session2:"1 mashg'ulot",
    max_w:"MAX OG'IRLIK",
    dist_short:"MASOFA (KM)",
    field_waist:"Bel",
    field_hips:"Tos",
    field_chest:"Ko'krak",
    field_arm:"Qo'l (biceps)",
    field_thigh:"Son",
    field_age:"Yosh",
    field_age_y:"Yosh (yillar)",
    field_weight_kg:"Og'irlik (kg)",
    field_height_cm:"Bo'y (sm)",
    step_1_2:"QADAM 1 / 2",
    step_2_2:"QADAM 2 / 2",
    step_1_4b:"QADAM 1 / 4",
    step_2_4b:"QADAM 2 / 4",
    step_3_4b:"QADAM 3 / 4",
    step_4_4b:"QADAM 4 / 4",
    plan_s1:"REJALASHTIRISH · QADAM 1",
    plan_s2:"REJALASHTIRISH · QADAM 2",
    plan_s3:"REJALASHTIRISH · QADAM 3",
    sel_group_hint:"Bir yoki bir nechta guruh tanlang",
    next_datetime:"KEYINGI → SANA VA VAQT",
    choose_replacement:"ALMASHTIRISH TANLANG",
    warmup_exec_hint:"Asosiy mashqdan oldin isitishni bajaring",
    edit_btn:"O'ZGARTIRISH",
    edit_arrow:"O'ZGARTIRISH →",
    profile_section:"PROFIL",
    language_section:"TIL",
    score_section:"NATIJA",
    notes_section:"IZOHLAR",
    cancel_btn2:"BEKOR QILISH",
    delete_btn:"O'CHIRISH",
    error_label2:"XATO",
    failed_load2:"YUKLAB BO'LMADI",
    points_short:"YONDASHUV",
    order_section:"TARTIB",
    meal_section:"OVQAT TURI",
    allergy_section:"ALLERGIYALAR",
    archive_section:"ARXIV",
    goal_section:"MAQSAD",
    status_section:"STATUS",
    level_section:"DARAJA",
    calories_section:"KALORIYA",
    exercises_section:"MASHQLAR",
    volume_section:"HAJM",
    tonnage_section:"TONNAJ",
    time_min_section:"VAQT (DAQIQA)",
    name_section:"NOMI",
    name_opt_section:"NOMI (IXTIYORIY)",
    food_catalog_section:"MAHSULOTLAR KATALOGI",
    food_ref_section:"MAHSULOTLAR MA'LUMOTNOMAI",
    new_product_section:"YANGI MAHSULOT (100g uchun)",
    add_product_btn:"MAHSULOT QO'SHISH",
    add_photo_btn:"FOTO QO'SHISH",
    add_exercise_btn:"MASHQ QO'SHISH",
    my_exercise_section:"O'Z MASHQIM",
    when_take_section:"QACHON QABUL QILISH",
    photo_kbju_title2:"FOTO → KALORIYA",
    ai_trainer_title:"AI MURABBIY",
    ai_trainer_online:"MURABBIY ALOQADA",
    analyzing_photo2:"AI FOTONI TAHLIL QILMOQDA...",
    workout_still_active:"⚠️ MASHQ HALI DAVOM ETMOQDA",
    record_sport:"⚽ MASHG'ULOTNI YOZ",
    edit_date_plan:"✏ SANA/TARKIBNI O'ZGARTIRISH",
    edit_profile_btn2:"✏ PROFILNI TAHRIRLASH",
    added_done:"✓ QO'SHILDI",
    warmup_done2:"✓ ISITISH BAJARILDI",
    save_confirm:"✓ SAQLASH",
    workout_saved_tab:"✓ MASHQ SAQLANDI → Rejalashtirilgan yorliq",
    calories_food:"🍽 KALORIYA (OVQAT)",
    warmup_badge3:"🏃 ISITISH",
    when_workout2:"📅 MASHQ QACHON?",
    share_btn2:"📤 ULASHISH",
    other_photo2:"📷 Boshqasi",
    analyze_btn2:"🔍 TAHLIL QILISH",
    bot_reminds2:"🔔 Bot eslatadi",
    burned_sport:"🔥 SARFLANDI (SPORT)",
    water_tap_hint:"← bir stakan suv belgisi uchun bosing",
    replace_exercise2:"↔ MASHQNI ALMASHTIRISH",
    do_replace2:"↔ ALMASHTIRISH",
    plateau_schedule:"Plato detektori har yakshanba 10:30 da tekshiradi.",
    bot_1h:"Bot 1 soat oldin eslatadi",
    bot_1h_full:"Bot mashqdan 1 soat oldin eslatadi",
    continue_workout3:"MASHQNI DAVOM ETTIRISH",
    skip_warmup2:"ISITISHNI O'TKAZIB YUBORISH",
    warmup_rec_time:"TAVSIYA ETILGAN ISITISH VAQTI",
    no_allergies2:"Allergiya yo'q",
    no_conditions2:"Cheklovlar yo'q",
    not_specified3:"Ko'rsatilmagan",
    measurements_hint:"O'lchovlar tarixda saqlanadi — dinamikani kuzating",
    ai_trainer_hint:"AI murabbiy maqsadingizga mos maslahat beradi",
    goal_hint:"MAQSADINGIZ NIMA?",
    name_hint2:"SALOM! ISMINGIZ NIMA?",
    requests_left:"SO'ROVLAR QOLDI ·",
    or_write:"yoki yozing",
    pts_per:"mashqdan oldin.",
    pts_bonus:"+8 ball",
    no_data_short:"ma'lumot yo'q",
    day_30:"30 kun",
    day_60:"60 kun",
    day_90:"90 kun",
    day_180:"180 kun",
    hour_1:"1 soat",
    ai_chat_title:"MURABBIY BILAN MULOQOT",
    ai_clear:"🗑 TOZALASH",
    ai_coach_label:"🤖 MURABBIY",
    ai_thinking2:"MURABBIY FIKRLAYDI...",
    ai_analyzing:"MASHQ TAHLIL QILINMOQDA...",
    ai_review_title:"AI MURABBIY BAHOLASHI",
    ai_coach_advice:"💬 MURABBIY MASLAHATI",
    ai_proposes:"💪 AI MASHQ TAKLIF QILMOQDA",
    ai_save_plan:"📅 JADVALGA SAQLASH",
    ai_date_hint:"Saqlashdan oldin sana va vaqtni tanlang",
    ai_saved:"✓ MASHQ SAQLANDI → Rejalashtirilgan yorliq",
    open_schedule:"JADVALINI OCHISH →",
    continue_dialog:"+ DAVOM ETISH",
    quick_questions:"TEZKOR SAVOLLAR",
    voice_hint:"🎙 OVOZ · YOKI YOZING",
    voice_full_hint:"🎙 YOZISH UCHUN BOSING · YOKI YOZING",
    recognizing:"TANILMOQDA...",
    no_mic:"Mikrofonga ruxsat yo'q",
    no_audio:"Audio ma'lumotlari yo'q",
    speech_not_recognized:"Nutq tanilmadi",
    transcription_error:"Transkripsiya xatosi",
    progress_title2:"MENING TARAQQIYOTIM",
    weekly_activity:"HAFTALIK FAOLLIK",
    workouts_per_week:"mashq haftada",
    muscle_progress:"MUSHAK GURUHLARI BO'YICHA TARAQQIYOT",
    strength_norms:"SIZNING KUCHINGIZ VS NORMALAR",
    no_data_period:"Tanlangan davr uchun ma'lumot yo'q",
    need_2_workouts:"Grafik uchun ≥2 mashq kerak",
    max_weight:"MAX OG'IRLIK",
    volume_unit:"hajm (kg×marta)",
    sessions_count:"mashg'ulot",
    one_session:"mashg'ulot",
    weight_dynamics:"VAZN DINAMIKASI",
    timer_title:"DAM OLISH TAYMERI",
    tools_title:"ASBOBLAR",
    rest_done:"✓ DAM OLISH TUGADI",
    rest_label:"DAM OLISH",
    choose_time:"VAQTNI TANLANG",
    pause_btn:"⏸ PAUZA",
    start_btn2:"▶ BOSHLASH",
    add30:"+30 soniya",
    minus15:"−15 soniya",
    reset_btn2:"TOZALASH",
    supps_title2:"QO'SHIMCHALAR",
    supps_cat:"SPORT QO'SHIMCHALARI",
    supps_ref:"MA'LUMOTNOMA",
    supp_dose_label:"DOZASI",
    supp_when:"QACHON QABUL QILISH",
    supp_sources:"MANBALAR",
    supp_desc:"TAVSIF VA MASLAHATLAR",
    supp_warning:"⚠️ Vitamin va qo'shimchalar qabul qilish tibbiy maslahat emas.",
    food_guide_cat:"MA'LUMOTNOMA",
    food_guide_title2:"MAHSULOTLAR KATALOGI",
    food_when:"⏰ QACHON YEYISH",
    food_tips:"💡 MASLAHATLAR",
    food_best:"🏆 ENG YAXSHI MAHSULOTLAR",
    food_combines:"✅ UYG'UN KELADI",
    food_avoid:"❌ BIRGA ISTE'MOL ETMANG",
    error_server:"Server xatosi",
    error_save:"Saqlash xatosi",
    error_net:"Tarmoq xatosi",
    error_request:"So'rov xatosi",
    error_launch:"Ishga tushirish xatosi",
    error_load:"Yuklash xatosi",
    error_try_again:"Xato. Qayta urinib ko'ring.",
    open_telegram:"Telegram orqali oching.",
    failed_load:"Yuklab bo'lmadi",
    failed_recognize:"Tanib bo'lmadi. Boshqa foto urinib ko'ring.",
    limit_exceeded:"Kunlik limit tugadi. Ertaga urinib ko'ring.",
    specify_name:"Nomni kiriting",
    specify_name_cal:"Nom va kaloriyalarni kiriting",
    delete_confirm:"Mashg'ulotni o'chirilsinmi?",
    no_answer:"Javob yo'q",
    another_one:"YANA BIRI",
    going_in:"KIRILMOQDA...",
    exercises_none:"Mashqlar tanlanmagan",
    exercises_none_planned:"Mashqlar rejalashtirilmagan edi",
    my_workout_name:"Mening mashqim",
    workout_name_opt:"NOMI (IXTIYORIY)",
    workout_status_active:"⚠️ MASHQ HALI DAVOM ETMOQDA",
    scheduled_workout:"REJALASHTIRILGAN MASHQ",
    scheduled_done:"REJALASHTIRILDI",
    my_workouts_title:"MENING MASHQLARIM",
    schedule_label:"JADVAL",
    upcoming_label:"KELGUSI",
    archive_planned:"REJALASHTIRILGAN ARXIV",
    search_exercise:"Mashq qidirish...",
    search_placeholder2:"Qidirish...",
    name_label:"NOMI",
    name_req:"Nomi *",
    exercise_group:"Mushak guruhi",
    sets_num:"Yondashuv",
    reps_num:"Marta",
    all_btn:"BARCHASI",
    knowledge_base:"BILIM BAZASI",
    save_measurements2:"O'LCHOVLARNI SAQLASH",
    saving:"SAQLANMOQDA...",
    saving2:"SAQLANMOQDA...",
    saved2:"✓ SAQLANDI",
    when_workout:"📅 MASHQ QACHON?",
    share_btn:"📤 ULASHISH",
    other_photo:"📷 Boshqasi",
    warmup_badge2:"🏃 ISITISH",
    notifications_hint:"🔔 Bot mashqdan 1 soat oldin eslatadi.",
    not_found_hint:"Hech narsa topilmadi",
    enter_name_or_cat:"NOMI KIRITING YOKI KATEGORIYA TANLANG",
    calories_eaten:"🍽 KALORIYA (OVQAT)",
    calories_burned2:"🔥 SARFLANDI (SPORT)",
    trainer_bot:"Bot 1 soat oldin eslatadi",
    trainer_bot2:"Bot mashqdan 1 soat oldin eslatadi",
    conflict_time:"boshqa vaqt tanlaysizmi?",
    dist_km:"MASOFA (KM)",
    imt_label:"TKI",
    workout_done2:"Mashq tugadi",
    workout_type:"Mashq",
    sets_short:"yondashuv",
    reps_done:"bajarildi",
    rpe_label:"RPE",
    warmup_duration:"5–10 daqiqa",
    add_time30:"+30 soniya",
    minus_time15:"−15 soniya",
    no_sets_data:"ma'lumot yo'q",
    one_portion:"1 porsiya",
    portions_pack:"qadoqdagi porsiyalar",
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
    muscles_title:"БҰЛШЫҚЕТ ТОПТАРЫ", exercises_title:"ЖАТТЫҒУЛАР", replace_title:"АУЫСТЫРУ", show_all_exercises:"БАРЛЫҚ ЖАТТЫҒУЛАРДЫ КӨРСЕТУ",
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
    goal_health:"Денсаулық",
    goal_lose:"Салмақ жоғалту",
    goal_muscle:"Бұлшықет өсіру",
    goal_strength:"Күш",
    goal_endurance:"Төзімділік",
    level_beginner:"Бастаушы",
    level_intermediate:"Орта",
    level_advanced:"Озық",
    difficulty_easy:"Жеңіл",
    difficulty_medium:"Орташа",
    difficulty_hard:"Қиын",
    gender_male:"Ер",
    gender_female:"Әйел",
    next_btn2:"КЕЛЕСІ →",
    back_to_menu:"← МӘЗІРГЕ",
    search_placeholder:"ІЗДЕУ...",
    enter_name:"Атыңыз",
    enter_goal:"МАҚСАТЫҢЫЗ НЕ?",
    hello_name:"СӘЛЕМ! АТЫҢЫЗ КІМ?",
    name_hint:"Атыңыз қосымшада көрсетіледі",
    sets_label:"ЖОЛДАС",
    reps_label2:"РЕТ",
    exercises_label:"ЖАТТЫҒУЛАР",
    minutes_label:"МИНУТ",
    tonnage_label2:"ТОННАЖ",
    volume_label:"КӨЛЕМ",
    weight_label2:"САЛМАҚ",
    date_label:"КҮН",
    time_label2:"УАҚЫТ",
    difficulty_label:"ҚИЫНДЫҚ",
    equipment_label:"ЖАБДЫҚТАР",
    description_label:"СИПАТТАМА",
    technique_label:"ОРЫНДАУ ТЕХНИКАСЫ",
    more_info:"ТОЛЫҒЫРАҚ →",
    open_plan:"ҚҰРАМЫН АШУ →",
    continue_workout2:"ЖАТТЫҒУДЫ ЖАЛҒАСТЫРУ",
    unfinished:"Аяқталмаған жаттығуыңыз бар",
    skip_warmup:"ЖЫЛЫТУДЫ ӨТКІЗІП ЖІБЕРу",
    warmup_time:"ҰСЫНЫЛАТЫН ЖЫЛЫТУ УАҚЫТЫ",
    replace_exercise:"↔ ЖАТТЫҒУДЫ АУЫСТЫРУ",
    do_replace:"↔ АУЫСТЫРУ",
    add_exercise:"+ ЖАТТЫҒУ ҚОСУ",
    add_during:"ЖАТТЫҒУ ҚОСУ",
    my_exercise:"ӨЗ ЖАТТЫҒУЫМ",
    all_exercises:"БАРЛЫҚ ЖАТТЫҒУЛАР →",
    show_exercises:"БАРЛЫҚ ЖАТТЫҒУЛАРДЫ КӨРСЕТу →",
    order_hint2:"↑↓ — тәртіп · ↔ — ауыстыру",
    steps_1_4:"ҚАДАМ 1 / 4",
    steps_2_4:"ҚАДАМ 2 / 4",
    steps_3_4:"ҚАДАМ 3 / 4",
    steps_4_4:"ҚАДАМ 4 / 4",
    steps_1_2:"ҚАДАМ 1 / 2",
    steps_2_2:"ҚАДАМ 2 / 2",
    plan_step1:"ЖОСПАРЛАУ · ҚАДАМ 1",
    plan_step2:"ЖОСПАРЛАУ · ҚАДАМ 2",
    plan_step3:"ЖОСПАРЛАУ · ҚАДАМ 3",
    calories_label2:"КАЛОРИЯ",
    proteins_label:"АҚУЫЗДАР",
    fats_label:"МАЙЛАР",
    carbs_label:"КӨМІРСУЛАР",
    kcal_unit:"ккал",
    kcal_per100:"ккал/100г",
    protein_g:"Ақуыз г",
    fat_g:"Май г",
    carb_g:"Көмірсу г",
    weight_g:"Салмақ (кг)",
    portions_label:"АС ТҮРІ",
    add_meal2:"КҮНДЕЛІККЕ ҚОСУ",
    add_product:"ӨНІМ ҚОСУ",
    new_product:"ЖАҢА ӨНІМ (100г үшін)",
    product_catalog:"ӨНІМДЕР КАТАЛОГЫ",
    food_catalog_title:"ӨНІМДЕР АНЫҚТАМАСЫ",
    food_catalog_kbju:"100Г ҮШІН",
    search_product:"Өнімді іздеу...",
    product_name:"Өнім атауы *",
    dish_name:"Тағам атауы",
    add_custom_product:"+ ӨЗ ӨНІМІМДІ ҚОСУ",
    product_exists:"Бұл атаулы өнім бұрыннан бар",
    calories_short:"Ккал",
    calories_req:"Ккал *",
    carbs_short:"Көмірсу",
    photo_kbju_title:"ФОТО → КАЛОРИЯ",
    photo_kbju_hint:"Тағамды суретке түсіріңіз — AI калорияны санайды",
    analyzing_photo:"AI СУРЕТТІ ТАЛДАУДА...",
    analyze_btn:"🔍 ТАЛДАУ",
    new_photo:"ЖАҢА ФОТО",
    add_to_diary2:"💾 КҮНДЕЛІККЕ",
    add_photo:"ФОТО ҚОСУ",
    ai_nutrition_title:"AI ТАМАҚТАНУ",
    saved_to_diary:"✓ ТАМАҚТАНУ КҮНДЕЛІГІНЕ САҚТАЛДЫ",
    measurements_title2:"ДЕНЕ ӨЛШЕМДЕРІ",
    measurements_cat:"АНТРОПОМЕТРИЯ",
    save_measurements:"ӨЛШЕМДЕРДІ САҚТАУ",
    measurements_saved:"✓ ӨЛШЕМДЕР САҚТАЛДЫ",
    measurements_history:"ТАРИХ",
    measurements_add:"ҚОСУ",
    measurements_none:"Әлі өлшемдер жоқ",
    waist:"Бел",
    hips:"Жамбас",
    chest:"Кеуде",
    arm:"Қол (бицепс)",
    thigh:"Сан",
    checkin_title2:"ТЕКСЕРУ",
    checkin_weekly:"АПТАЛЫҚ",
    checkin_saved:"ТЕКСЕРУ САҚТАЛДЫ",
    send_checkin:"ТЕКСЕРУДІ ЖІБЕРУ",
    checkin_ai_hint:"AI жаттықтырушы жаңартылған деректерді алды",
    sleep_hours:"ҰЙҚЫ (САҒАТ)",
    energy_label:"Энергия",
    stress_label:"Стресс",
    motivation_label:"Мотивация",
    profile_fill:"Профильді толтырыңыз",
    profile_fill_hint:"Жаттығуларды бейімдеу үшін профильді толтырыңыз",
    profile_edit:"✏ ПРОФИЛЬДІ ӨЗГЕРТУ",
    edit_date:"✏ КҮНДІ/ҚҰРАМДЫ ӨЗГЕРТУ",
    age_label:"Жас",
    age_years:"Жас (жылдар)",
    height_label:"Бой",
    height_cm:"Бой (см)",
    bmi_label:"ДСИ",
    gender_label:"ЖЫН",
    ai_style_label:"AI ҚАРЫМ-ҚАТЫНАС СТИЛІ",
    status_saved:"✓ САҚТАЛДЫ",
    profile_saved2:"✓ ӨЛШЕМДЕР САҚТАЛДЫ",
    ai_bro_desc:"Жастар, сленг, мотивация",
    ai_mentor_desc:"Орташа, қолдау, кеңес",
    ai_expert_desc:"Кәсіби, терминдер",
    ai_bro_name:"Фитнес-бро",
    med_label:"МЕДИЦИНАЛЫҚ КӨРСЕТКІШТЕР",
    no_med:"Шектеулер жоқ",
    supps_label:"💊 МЕНІҢ ҚОСПАЛАРЫМ",
    quick_select:"ЖЫЛДАМ ТАҢДАУ",
    manual_input:"НЕМЕСЕ ӨЗ ҚОЛЫҢЫЗБЕН ЕНГІЗІҢІЗ",
    supp_name:"Қоспа атауы...",
    supp_dose:"Дозасы (мысалы 5г)",
    supp_timing:"Уақыты (таңертең, жаттығуға дейін)",
    not_specified2:"Көрсетілмеген",
    gamification_title2:"МЕНІҢ СТАТУСЫМ",
    my_rating2:"МЕНІҢ РЕЙТИНГІМ",
    status_label2:"СТАТУС",
    points_label2:"БАЛЛДАР",
    rank_label2:"ДӘРЕЖЕ",
    leaderboard_title:"ЖЕТЕКШІЛЕР КЕСТЕСІ",
    my_position:"МЕНІҢ ОРНЫМ",
    how_earn:"БАЛЛ ҚАЛАЙ ЖИНАУҒА БОЛАДЫ",
    recent_points:"СОҢҒЫ ЕСЕПТЕУЛЕР",
    next_rank:"КЕЛЕСІ ДӘРЕЖЕГЕ",
    streak_series:"🔥 БЕЛСЕНДІЛІК СЕРИЯСЫ",
    achievements_title2:"ЖЕТІСТІКТЕР",
    new_achievement:"🎉 ЖАҢА ЖЕТІСТІК",
    progress_label:"ПРОГРЕСС",
    unlocked_label:"АШЫЛДЫ",
    referral_title2:"БОНУС БАҒДАРЛАМАСЫ",
    how_works:"ҚАЛАЙ ЖҰМЫС ІСТЕЙДІ",
    goals_title2:"МЕНІҢ МАҚСАТТАРЫМ",
    goals_add:"+ МАҚСАТ ҚОСУ",
    new_goal:"ЖАҢА МАҚСАТ",
    goal_desc:"Мақсат сипаттамасы...",
    goal_achieved:"ЖЕТІЛДІ",
    no_goals:"Белсенді мақсаттар жоқ. Бірінші мақсатты қойыңыз!",
    goal_target:"Мақсат",
    goal_unit:"бірлік",
    reminders_title2:"ЕСКЕ САЛУЛАР",
    reminders_cat:"ХАБАРЛАНДЫРУЛАР",
    upcoming_workouts:"АЛДАҒЫ ЖАТТЫҒУЛАР",
    no_reminders:"Алдағы жаттығулар жоқ",
    bot_reminds:"🔔 Бот еске салады",
    one_hour:"1 сағат",
    before_workout:"жаттығудан бұрын",
    plateau_check:"Плато детекторы әр жексенбі 10:30-да тексереді.",
    add_plan:"+ ЖОСПАРЛАУ",
    add_plan2:"+ ЖАТТЫҒУДЫ ЖОСПАРЛАУ",
    support_title2:"ҚОЛДАУ",
    support_cat:"КЕРІ БАЙЛАНЫС",
    support_placeholder:"Мәселеңізді сипаттаңыз, жақын арада жауап береміз",
    support_problem:"МӘСЕЛЕ НЕМЕСЕ СҰРАҚТЫ СИПАТТАҢЫЗ",
    sending:"ЖІБЕРІЛУДЕ...",
    sent:"ЖІБЕРІЛДІ",
    send_btn:"ЖІБЕРУ",
    error_send:"Жіберу қатесі. Кейінірек байқаңыз.",
    error_conn:"Қосылым жоқ. Интернетті тексеріңіз.",
    error_conn2:"Қосылым жоқ. Кейінірек байқаңыз.",
    language_title2:"ТІЛ",
    settings_title:"БАПТАУЛАР",
    current_lang:"✓ АҒЫМДАҒЫ",
    sport_title2:"СПОРТ ТҮРЛЕРІ",
    sport_cat:"СПОРТ",
    record_btn:"ЖАЗЫЛДЫ",
    sport_full_record:"Толық жазба Жаттығулар → ⚽ Спорт бөлімінде",
    score_optional:"Нәтиже, серіктер, сезімдер...",
    score_example:"Мысалы: 3:2 немесе 21:18",
    sport_planned:"📤 БӨЛІСУ",
    no_activities:"Сабақтар жоқ",
    ai_training:"AI ЖАТТЫҚТЫРУШЫ",
    greeting_back:"СӘЛЕМ,",
    greeting_back2:"ҚАЙТА КЕЛДІҢІЗ",
    streak_day1:"КҮН",
    streak_day24:"КҮН",
    streak_days5:"КҮН",
    streak_podryad:"ҚАТАРЫНАН",
    ai_today:"AI бүгін",
    checkin_card_hint:"Аптасына бір рет — жексенбі кешінде немесе дүйсенбі таңертеңінде толтырыңыз.",
    checkin_card_hint2:"жоспарларды, жауаптар мен кеңестерді жасауда тексеруіңізді ескереді.",
    level_below:"Бастаушыдан төмен",
    level_elite:"Элита",
    norm_beg:"Бас",
    norm_mid:"Орт",
    norm_adv:"Озық",
    norm_elite:"Элита",
    age_suffix:"ж",
    coef_label:"коэф.",
    sleep_label2:"Ұйқы",
    supp_timing_anytime:"Күн сайын кез келген уақытта",
    supp_timing_food:"Тамақпен бірге",
    supp_timing_food_sleep:"Тамақпен немесе ұйқыға дейін",
    supp_timing_before:"Жаттығудан 30–45 минут бұрын",
    supp_timing_morning:"Таңертең майлы тамақпен",
    supp_timing_sleep:"Ұйқыға дейін",
    supp_timing_collagen:"Жаттығудан 1 сағат бұрын С витаминімен",
    supp_protein:"Протеин",
    supp_creatine:"Креатин моногидрат",
    supp_omega:"Омега-3",
    supp_vitd:"D3 витамині",
    supp_magnesium:"Магний",
    supp_bcaa:"BCAA",
    supp_zinc:"Мырыш",
    supp_vitc:"С витамині",
    supp_multi:"Мультивитаминдер",
    supp_glutamine:"Глютамин",
    supp_collagen:"Коллаген",
    supp_melatonin:"Мелатонин",
    supp_caffeine:"Кофеин",
    supp_beta:"Бета-аланин",
    supp_preworkout:"Предтреник",
    add30s:"+30 секунд",
    minus15s:"−15 секунд",
    rest_5_10:"5–10 минут",
    sets_short2:"жолдас",
    reps_short2:"РЕТ",
    pts_short:"балл.",
    pts_label:"баллдар",
    kcal_short:"ккал",
    kcal_100g:"ккал/100г",
    volume_short:"көлем (кг×рет)",
    workouts_week:"жаттығу аптасына",
    one_session2:"1 сабақ",
    max_w:"MAX САЛМАҚ",
    dist_short:"ҚАШЫҚТЫҚ (КМ)",
    field_waist:"Бел",
    field_hips:"Жамбас",
    field_chest:"Кеуде",
    field_arm:"Қол (бицепс)",
    field_thigh:"Сан",
    field_age:"Жас",
    field_age_y:"Жас (жылдар)",
    field_weight_kg:"Салмақ (кг)",
    field_height_cm:"Бой (см)",
    step_1_2:"ҚАДАМ 1 / 2",
    step_2_2:"ҚАДАМ 2 / 2",
    step_1_4b:"ҚАДАМ 1 / 4",
    step_2_4b:"ҚАДАМ 2 / 4",
    step_3_4b:"ҚАДАМ 3 / 4",
    step_4_4b:"ҚАДАМ 4 / 4",
    plan_s1:"ЖОСПАРЛАУ · ҚАДАМ 1",
    plan_s2:"ЖОСПАРЛАУ · ҚАДАМ 2",
    plan_s3:"ЖОСПАРЛАУ · ҚАДАМ 3",
    sel_group_hint:"Бір немесе бірнеше топ таңдаңыз",
    next_datetime:"КЕЛЕСІ → КҮН МЕН УАҚЫТ",
    choose_replacement:"АУЫСТЫРУДЫ ТАҢДАҢЫЗ",
    warmup_exec_hint:"Негізгі жаттығудан бұрын жылытуды орындаңыз",
    edit_btn:"ӨЗГЕРТУ",
    edit_arrow:"ӨЗГЕРТУ →",
    profile_section:"ПРОФИЛЬ",
    language_section:"ТІЛ",
    score_section:"НӘТИЖЕ",
    notes_section:"ЖАЗБАЛАР",
    cancel_btn2:"БОЛДЫРМАУ",
    delete_btn:"ЖОЮ",
    error_label2:"ҚАТЕ",
    failed_load2:"ЖҮКТЕУ МҮМКІН ЕМЕС",
    points_short:"ЖОЛДАС",
    order_section:"ТӘРТІП",
    meal_section:"АС ТҮРІ",
    allergy_section:"АЛЛЕРГИЯЛАР",
    archive_section:"МҰРАҒАТ",
    goal_section:"МАҚСАТ",
    status_section:"СТАТУС",
    level_section:"ДЕҢГЕЙ",
    calories_section:"КАЛОРИЯ",
    exercises_section:"ЖАТТЫҒУЛАР",
    volume_section:"КӨЛЕМ",
    tonnage_section:"ТОННАЖ",
    time_min_section:"УАҚЫТ (МИН)",
    name_section:"АТЫ",
    name_opt_section:"АТЫ (МІНДЕТТІ ЕМЕС)",
    food_catalog_section:"ӨНІМДЕР КАТАЛОГЫ",
    food_ref_section:"ӨНІМДЕР АНЫҚТАМАСЫ",
    new_product_section:"ЖАҢА ӨНІМ (100г үшін)",
    add_product_btn:"ӨНІМ ҚОСУ",
    add_photo_btn:"ФОТО ҚОСУ",
    add_exercise_btn:"ЖАТТЫҒУ ҚОСУ",
    my_exercise_section:"ӨЗ ЖАТТЫҒУЫМ",
    when_take_section:"ҚАШАН ҚАБЫЛДАУ",
    photo_kbju_title2:"ФОТО → КАЛОРИЯ",
    ai_trainer_title:"AI ЖАТТЫҚТЫРУШЫ",
    ai_trainer_online:"ЖАТТЫҚТЫРУШЫ БАЙЛАНЫСТА",
    analyzing_photo2:"AI СУРЕТТІ ТАЛДАУДА...",
    workout_still_active:"⚠️ ЖАТТЫҒУ ӘЛІ ЖҮРІП ЖАТЫР",
    record_sport:"⚽ САБАҚТЫ ЖАЗ",
    edit_date_plan:"✏ КҮНДІ/ҚҰРАМДЫ ӨЗГЕРТУ",
    edit_profile_btn2:"✏ ПРОФИЛЬДІ ӨЗГЕРТУ",
    added_done:"✓ ҚОСЫЛДЫ",
    warmup_done2:"✓ ЖЫЛЫТУ ОРЫНДАЛДЫ",
    save_confirm:"✓ САҚТАУ",
    workout_saved_tab:"✓ ЖАТТЫҒУ САҚТАЛДЫ → Жоспарланғандар қойындысы",
    calories_food:"🍽 КАЛОРИЯ (АС)",
    warmup_badge3:"🏃 ЖЫЛЫТУ",
    when_workout2:"📅 ЖАТТЫҒУ ҚАШАН?",
    share_btn2:"📤 БӨЛІСУ",
    other_photo2:"📷 Басқасы",
    analyze_btn2:"🔍 ТАЛДАУ",
    bot_reminds2:"🔔 Бот еске салады",
    burned_sport:"🔥 ЖҰМСАЛДЫ (СПОРТ)",
    water_tap_hint:"← бір стакан су белгілеу үшін басыңыз",
    replace_exercise2:"↔ ЖАТТЫҒУДЫ АУЫСТЫРУ",
    do_replace2:"↔ АУЫСТЫРУ",
    plateau_schedule:"Плато детекторы әр жексенбі 10:30-да тексереді.",
    bot_1h:"Бот 1 сағат бұрын еске салады",
    bot_1h_full:"Бот жаттығудан 1 сағат бұрын еске салады",
    continue_workout3:"ЖАТТЫҒУДЫ ЖАЛҒАСТЫРУ",
    skip_warmup2:"ЖЫЛЫТУДЫ ӨТКІЗІП ЖІБЕРу",
    warmup_rec_time:"ҰСЫНЫЛАТЫН ЖЫЛЫТУ УАҚЫТЫ",
    no_allergies2:"Аллергия жоқ",
    no_conditions2:"Шектеулер жоқ",
    not_specified3:"Көрсетілмеген",
    measurements_hint:"Өлшемдер тарихта сақталады — динамиканы бақылаңыз",
    ai_trainer_hint:"AI жаттықтырушы мақсатыңызға сай кеңес береді",
    goal_hint:"МАҚСАТЫҢЫЗ НЕ?",
    name_hint2:"СӘЛЕМ! АТЫҢЫЗ КІМ?",
    requests_left:"СҰРАУЛАР ҚАЛДЫ ·",
    or_write:"немесе жазыңыз",
    pts_per:"жаттығудан бұрын.",
    pts_bonus:"+8 балл",
    no_data_short:"деректер жоқ",
    day_30:"30 күн",
    day_60:"60 күн",
    day_90:"90 күн",
    day_180:"180 күн",
    hour_1:"1 сағат",
    ai_chat_title:"ЖАТТЫҚТЫРУШЫМЕН СҰХБАТ",
    ai_clear:"🗑 ТАЗАЛАУ",
    ai_coach_label:"🤖 ЖАТТЫҚТЫРУШЫ",
    ai_thinking2:"ЖАТТЫҚТЫРУШЫ ОЙЛАНАДЫ...",
    ai_analyzing:"ЖАТТЫҒУ ТАЛДАНУДА...",
    ai_review_title:"AI ЖАТТЫҚТЫРУШЫ БАҒАЛАУЫ",
    ai_coach_advice:"💬 ЖАТТЫҚТЫРУШЫ КЕҢЕСІ",
    ai_proposes:"💪 AI ЖАТТЫҒУ ҰСЫНАДЫ",
    ai_save_plan:"📅 КЕСТЕГЕ САҚТАУ",
    ai_date_hint:"Сақтамас бұрын күн мен уақытты таңдаңыз",
    ai_saved:"✓ ЖАТТЫҒУ САҚТАЛДЫ → Жоспарланғандар қойындысы",
    open_schedule:"КЕСТЕНІ АШУ →",
    continue_dialog:"+ ЖАЛҒАСТЫРУ",
    quick_questions:"ЖЫЛДАМ СҰРАҚТАР",
    voice_hint:"🎙 ДАУЫС · НЕМЕСЕ ЖАЗЫҢЫЗ",
    voice_full_hint:"🎙 ЖАЗУ ҮШІН БАСЫҢЫЗ · НЕМЕСЕ ЖАЗЫҢЫЗ",
    recognizing:"ТАНЫЛУДА...",
    no_mic:"Микрофонға рұқсат жоқ",
    no_audio:"Аудио деректер жоқ",
    speech_not_recognized:"Сөйлеу танылмады",
    transcription_error:"Транскрипция қатесі",
    progress_title2:"МЕНІҢ ПРОГРЕСІМ",
    weekly_activity:"АПТАЛЫҚ БЕЛСЕНДІЛІК",
    workouts_per_week:"жаттығу аптасына",
    muscle_progress:"БҰЛШЫҚЕТ ТОПТАРЫ БОЙЫНША ПРОГРЕСС",
    strength_norms:"СІЗДІҢ КҮШІҢІЗ VS НОРМАЛАР",
    no_data_period:"Таңдалған кезең үшін деректер жоқ",
    need_2_workouts:"График үшін ≥2 жаттығу керек",
    max_weight:"MAX САЛМАҚ",
    volume_unit:"көлем (кг×рет)",
    sessions_count:"сабақ",
    one_session:"сабақ",
    weight_dynamics:"САЛМАҚ ДИНАМИКАСЫ",
    timer_title:"ДЕМАЛыс ТАЙМЕРІ",
    tools_title:"АСПАПТАР",
    rest_done:"✓ ДЕМАЛЫС АЯҚТАЛДЫ",
    rest_label:"ДЕМАЛЫС",
    choose_time:"УАҚЫТТЫ ТАҢДАҢЫЗ",
    pause_btn:"⏸ ПАУЗА",
    start_btn2:"▶ БАСТАУ",
    add30:"+30 секунд",
    minus15:"−15 секунд",
    reset_btn2:"ТАЗАЛАУ",
    supps_title2:"ҚОСПАЛАР",
    supps_cat:"СПОРТ ҚОСПАЛАРЫ",
    supps_ref:"АНЫҚТАМА",
    supp_dose_label:"ДОЗАСЫ",
    supp_when:"ҚАШАН ҚАБЫЛДАУ",
    supp_sources:"ДЕРЕККӨЗДЕР",
    supp_desc:"СИПАТТАМА ЖӘНЕ КЕҢЕСТЕР",
    supp_warning:"⚠️ Витаминдер мен қоспаларды қолдану медициналық кеңес емес.",
    food_guide_cat:"АНЫҚТАМА",
    food_guide_title2:"ӨНІМДЕР КАТАЛОГЫ",
    food_when:"⏰ ҚАШАН ЖЕУ",
    food_tips:"💡 КЕҢЕСТЕР",
    food_best:"🏆 ЕҢ ЖАҚСЫ ӨНІМДЕР",
    food_combines:"✅ ҮЙЛЕСЕДІ",
    food_avoid:"❌ БІРГЕ ТҰТЫНБАҢЫЗ",
    error_server:"Сервер қатесі",
    error_save:"Сақтау қатесі",
    error_net:"Желі қатесі",
    error_request:"Сұрау қатесі",
    error_launch:"Іске қосу қатесі",
    error_load:"Жүктеу қатесі",
    error_try_again:"Қате. Қайта байқаңыз.",
    open_telegram:"Telegram арқылы ашыңыз.",
    failed_load:"Жүктеу мүмкін емес",
    failed_recognize:"Танып болмады. Басқа фото байқаңыз.",
    limit_exceeded:"Күндік лимит таусылды. Ертең байқаңыз.",
    specify_name:"Атауды енгізіңіз",
    specify_name_cal:"Атау мен калорияларды енгізіңіз",
    delete_confirm:"Сабақты жоюды растайсыз ба?",
    no_answer:"Жауап жоқ",
    another_one:"ТАҒЫ БІРІ",
    going_in:"КІРІЛУДЕ...",
    exercises_none:"Жаттығулар таңдалмаған",
    exercises_none_planned:"Жаттығулар жоспарланбаған болатын",
    my_workout_name:"Менің жаттығуым",
    workout_name_opt:"АТЫ (МІНДЕТТІ ЕМЕС)",
    workout_status_active:"⚠️ ЖАТТЫҒУ ӘЛІ ЖҮРІП ЖАТЫР",
    scheduled_workout:"ЖОСПАРЛАНҒАН ЖАТТЫҒУ",
    scheduled_done:"ЖОСПАРЛАНДЫ",
    my_workouts_title:"МЕНІҢ ЖАТТЫҒУЛАРЫМ",
    schedule_label:"КЕСТЕ",
    upcoming_label:"АЛДАҒЫ",
    archive_planned:"ЖОСПАРЛАНҒАН МҰРАҒАТ",
    search_exercise:"Жаттығуды іздеу...",
    search_placeholder2:"Іздеу...",
    name_label:"АТЫ",
    name_req:"Аты *",
    exercise_group:"Бұлшықет тобы",
    sets_num:"Жолдас",
    reps_num:"Рет",
    all_btn:"БАРЛЫҒЫ",
    knowledge_base:"БІЛІМ БАЗАСЫ",
    save_measurements2:"ӨЛШЕМДЕРДІ САҚТАУ",
    saving:"САҚТАЛУДА...",
    saving2:"САҚТАЛУДА...",
    saved2:"✓ САҚТАЛДЫ",
    when_workout:"📅 ЖАТТЫҒУ ҚАШАН?",
    share_btn:"📤 БӨЛІСУ",
    other_photo:"📷 Басқасы",
    warmup_badge2:"🏃 ЖЫЛЫТУ",
    notifications_hint:"🔔 Бот жаттығудан 1 сағат бұрын еске салады.",
    not_found_hint:"Ештеңе табылмады",
    enter_name_or_cat:"АТЫ ЕНГІЗІҢІЗ НЕМЕСЕ САНАТТЫ ТАҢДАҢЫЗ",
    calories_eaten:"🍽 КАЛОРИЯ (АС)",
    calories_burned2:"🔥 ЖҰМСАЛДЫ (СПОРТ)",
    trainer_bot:"Бот 1 сағат бұрын еске салады",
    trainer_bot2:"Бот жаттығудан 1 сағат бұрын еске салады",
    conflict_time:"басқа уақыт таңдайсыз ба?",
    dist_km:"ҚАШЫҚТЫҚ (КМ)",
    imt_label:"ДСИ",
    workout_done2:"Жаттығу аяқталды",
    workout_type:"Жаттығу",
    sets_short:"жолдас",
    reps_done:"орындалды",
    rpe_label:"RPE",
    warmup_duration:"5–10 минут",
    add_time30:"+30 секунд",
    minus_time15:"−15 секунд",
    no_sets_data:"деректер жоқ",
    one_portion:"1 порция",
    portions_pack:"қаптағы порциялар",
  },
};
function t(key) { return T[LANG_STORE.current]?.[key] || T.ru[key] || key; }

// Локализованное поле из объекта API (name, description, technique)
// Translate equipment string
function tEquip(eq) {
  if (!eq) return "";
  const lang = LANG_STORE.current;
  if (lang === "ru") return eq;
  const map = {
    "Штанга / EZ-гриф":{en:"Barbell / EZ-bar",uz:"Shtanga / EZ-shtanga",kz:"Штанга / EZ-штанга"},
    "Штанга / гантели":{en:"Barbell / Dumbbells",uz:"Shtanga / gantellar",kz:"Штанга / гантельдер"},
    "Штанга + скамья":{en:"Barbell + Bench",uz:"Shtanga + skamya",kz:"Штанга + орындық"},
    "Штанга + наклонная скамья":{en:"Barbell + Incline bench",uz:"Shtanga + qiyalik skamya",kz:"Штанга + еңкіш орындық"},
    "Штанга или гантели, Скамья":{en:"Barbell or Dumbbells, Bench",uz:"Shtanga yoki gantellar, skamya",kz:"Штанга немесе гантельдер, орындық"},
    "Гантели + скамья":{en:"Dumbbells + Bench",uz:"Gantellar + skamya",kz:"Гантельдер + орындық"},
    "Гантель + скамья":{en:"Dumbbell + Bench",uz:"Gantel + skamya",kz:"Гантель + орындық"},
    "Гантели, Скамья":{en:"Dumbbells, Bench",uz:"Gantellar, skamya",kz:"Гантельдер, орындық"},
    "Гантели, Наклонная скамья":{en:"Dumbbells, Incline bench",uz:"Gantellar, qiyalik skamya",kz:"Гантельдер, еңкіш орындық"},
    "Гантели + скамья со спинкой":{en:"Dumbbells + Back bench",uz:"Gantellar + suyanchli skamya",kz:"Гантельдер + арқалы орындық"},
    "Гантель, Скамья":{en:"Dumbbell, Bench",uz:"Gantel, skamya",kz:"Гантель, орындық"},
    "Тренажёр «Бабочка»":{en:"Pec Deck",uz:"Pec-deck",kz:"Пек-дек"},
    "Тренажёр Hammer":{en:"Hammer Machine",uz:"Hammer trenajori",kz:"Hammer тренажері"},
    "Тренажёр Hammer Strength":{en:"Hammer Strength",uz:"Hammer Strength",kz:"Hammer Strength"},
    "Тренажёр гиперэкстензия":{en:"Hyperextension machine",uz:"Giperekstenziya trenajori",kz:"Гиперэкстензия тренажері"},
    "Тренажёр блок":{en:"Cable machine",uz:"Kabel trenajori",kz:"Кабель тренажері"},
    "Тренажёр для плеч":{en:"Shoulder press machine",uz:"Yelka pressi trenajori",kz:"Иық прессі тренажері"},
    "Блочный тренажёр":{en:"Cable machine",uz:"Blokli trenajor",kz:"Блокты тренажер"},
    "Кроссовер (блочный тренажёр)":{en:"Cable crossover",uz:"Kabel crossover",kz:"Кабель кроссовері"},
    "Скамья Скотта + EZ-гриф":{en:"Scott bench + EZ-bar",uz:"Skott skamyasi + EZ-shtanga",kz:"Скотт орындығы + EZ-штанга"},
    "Т-гриф":{en:"T-bar",uz:"T-shtanga",kz:"Т-штанга"},
    "Штанга с упором":{en:"Landmine barbell",uz:"Landmayn shtanga",kz:"Лэндмайн штанга"},
    "Штанга": {en:"Barbell",uz:"Shtanga",kz:"Штанга"},
    "Гантели": {en:"Dumbbells",uz:"Gantellar",kz:"Гантельдер"},
    "Гантель": {en:"Dumbbell",uz:"Gantel",kz:"Гантель"},
    "Турник": {en:"Pull-up bar",uz:"Turnik",kz:"Турник"},
    "Брусья": {en:"Parallel bars",uz:"Bruslari",kz:"Брустар"},
    "Тренажёр": {en:"Machine",uz:"Trenajor",kz:"Тренажер"},
    "Блок": {en:"Cable",uz:"Blok",kz:"Блок"},
    "Кроссовер": {en:"Cable crossover",uz:"Kabel crossover",kz:"Кабель кроссовері"},
    "Скамья": {en:"Bench",uz:"Skamya",kz:"Орындық"},
    "Резиновая лента": {en:"Resistance band",uz:"Rezinka",kz:"Резеңке"},
    "Резиновая лента, Стойка":{en:"Resistance band, Rack",uz:"Rezinka, stoyka",kz:"Резеңке, стойка"},
    "Без оборудования": {en:"No equipment",uz:"Jihozlarsiz",kz:"Жабдықсыз"},
    "Не нужно": {en:"No equipment",uz:"Kerak emas",kz:"Қажет емес"},
    "Гиря": {en:"Kettlebell",uz:"Girya",kz:"Гиря"},
    "EZ-гриф": {en:"EZ-bar",uz:"EZ-shtanga",kz:"EZ-штанга"},
    "Степ-платформа":{en:"Step platform",uz:"Step platforma",kz:"Степ платформа"},
  };
  if (map[eq]) return map[eq][lang] || eq;
  // Partial replacement - replace known RU words in complex strings
  let result = eq;
  const parts = [
    ["Штанга","Barbell","Shtanga","Штанга"],
    ["Гантели","Dumbbells","Gantellar","Гантельдер"],
    ["Гантель","Dumbbell","Gantel","Гантель"],
    ["Скамья","Bench","Skamya","Орындық"],
    ["Тренажёр","Machine","Trenajor","Тренажер"],
    ["Блок","Cable","Blok","Блок"],
    ["наклонная","incline","qiyalik","еңкіш"],
    ["Брусья","Bars","Bruslari","Брустар"],
    ["Турник","Bar","Turnik","Турник"],
  ];
  const idx = ["en","uz","kz"].indexOf(lang);
  if (idx >= 0) {
    for (const p of parts) result = result.split(p[0]).join(p[idx+1]);
  }
  return result;
}
function tField(obj, field) {
  if (!obj) return "";
  const lang = LANG_STORE.current;
  if (lang !== "ru" && obj[field + "_" + lang]) return obj[field + "_" + lang];
  return obj[field] || "";
}

// Локализованное название группы мышц
function tGroup(ex) {
  if (!ex) return "";
  const lang = LANG_STORE.current;
  if (lang !== "ru" && ex["group_name_" + lang]) return ex["group_name_" + lang];
  return ex.group_name || "";
}

// Локализованное название вида спорта
function tSport(sport) {
  if (!sport) return "";
  const lang = LANG_STORE.current;
  // Handle both full API objects (name_en) and mapped objects (l_en)
  if (lang !== "ru") {
    if (sport["name_" + lang]) return sport["name_" + lang];
    if (sport["l_" + lang]) return sport["l_" + lang];
  }
  return sport.name || sport.name_ru || sport.l || "";
}


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
const getGoalLabel=(key)=>({lose_weight:t("goal_lose"),gain_muscle:t("goal_muscle"),gain_strength:t("goal_strength"),improve_endurance:t("goal_endurance"),stay_healthy:t("goal_health")})[key]||GOAL_LABELS[key]||key;
const LEVEL_LABELS={beginner:"Новичок",intermediate:"Средний",advanced:"Продвинутый"};
const DIFF_COLOR={easy:C.success,medium:C.accent,hard:C.danger};
const getDiff=(d)=>({easy:t("difficulty_easy"),medium:t("difficulty_medium"),hard:t("difficulty_hard")})[d]||d;
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
  const endTimeRef=useRef(null); // абсолютное время окончания таймера (Date.now() + left*1000)

  function start(sec){
    setTotal(sec);setLeft(sec);setRunning(true);
    endTimeRef.current=Date.now()+sec*1000;
  }
  function pause(){
    setRunning(false);
    endTimeRef.current=null;
  }
  function resume(){
    setRunning(true);
    endTimeRef.current=Date.now()+(left||0)*1000;
  }
  function reset(){setRunning(false);setLeft(null);endTimeRef.current=null;}
  function addTime(sec){
    setLeft(p=>{
      const newLeft=p!=null?Math.max(0,p+sec):sec;
      if(endTimeRef.current)endTimeRef.current=Date.now()+newLeft*1000;
      return newLeft;
    });
  }

  // Пересчёт при возврате из фона (браузер замораживает setInterval в фоне)
  useEffect(()=>{
    function onVisible(){
      if(document.visibilityState==='visible'&&running&&endTimeRef.current){
        const remaining=Math.max(0,Math.round((endTimeRef.current-Date.now())/1000));
        if(remaining===0){
          setRunning(false);setLeft(0);
          if(navigator.vibrate)navigator.vibrate([200,100,200,100,400]);
        } else {
          setLeft(remaining);
        }
      }
    }
    document.addEventListener('visibilitychange',onVisible);
    return()=>document.removeEventListener('visibilitychange',onVisible);
  },[running]);

  useEffect(()=>{
    if(!running)return;
    intervalRef.current=setInterval(()=>{
      if(!endTimeRef.current)return;
      const remaining=Math.max(0,Math.round((endTimeRef.current-Date.now())/1000));
      setLeft(p=>{
        if(remaining<=0){
          setRunning(false);
          if(navigator.vibrate)navigator.vibrate([200,100,200,100,400]);
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
        return remaining;
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
          <button onClick={()=>addTime(30)} style={{flex:1,background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px",color:C.text,fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>{t("add30s")}</button>
          <button onClick={()=>addTime(-15)} style={{flex:1,background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px",color:C.muted,fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>{t("minus15s")}</button>
          <button onClick={reset} style={{flex:1,background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px",color:C.danger,fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>{t("reset_btn2")}</button>
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

function ExerciseSelectCard({ex,sel,onToggle}){
  const containerRef=useRef(null);
  const [inView,setInView]=useState(false);
  const [imgLoaded,setImgLoaded]=useState(false);

  useEffect(()=>{
    if(!ex.video_url||!containerRef.current)return;
    const obs=new IntersectionObserver((entries)=>{
      if(entries[0].isIntersecting){setInView(true);obs.disconnect();}
    },{rootMargin:"150px"});
    obs.observe(containerRef.current);
    return ()=>obs.disconnect();
  },[ex.video_url]);

  return (
    <Card style={{padding:0,overflow:"hidden",cursor:"default",marginBottom:0}}>
      <div ref={containerRef} style={{position:"relative",width:"100%",aspectRatio:"1/1",background:C.bg,overflow:"hidden"}}>
        {ex.video_url&&inView?
          <video src={ex.video_url} poster={ex.photo_url} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
            autoPlay loop muted playsInline preload="metadata" onError={e=>e.target.style.display="none"}/>
          :ex.photo_url?
          <img src={ex.photo_url} alt="" loading="lazy"
            style={{width:"100%",height:"100%",objectFit:"cover",display:"block",opacity:imgLoaded?1:0,transition:"opacity 0.25s ease"}}
            onLoad={()=>setImgLoaded(true)} onError={e=>e.target.style.display="none"}/>
          :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>{ex.group_emoji||"💪"}</div>}
        <button onClick={ev=>{ev.stopPropagation();onToggle();}} style={{position:"absolute",top:6,right:6,width:30,height:30,borderRadius:8,background:sel?C.accent:"rgba(0,0,0,0.55)",border:`0.5px solid ${sel?C.accent:C.border}`,color:sel?C.bg:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {sel?`${sel.order}`:"+"}
        </button>
      </div>
      <div style={{padding:"9px 10px 11px"}}>
        <div style={{fontWeight:600,fontSize:12.5,color:C.text,lineHeight:1.3,marginBottom:5,minHeight:32}}>{tField(ex,"name")}</div>
        <Tag color={DIFF_COLOR[ex.difficulty]||C.muted}>{getDiff(ex.difficulty)}</Tag>
      </div>
    </Card>
  );
}

function ExCard({ex,onClick,badge,action}){
  return <Card onClick={onClick} style={{marginBottom:8}}>
    <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
      {ex.photo_url&&<img src={ex.photo_url} alt="" style={{width:56,height:56,borderRadius:8,objectFit:"cover",flexShrink:0}} onError={e=>e.target.style.display="none"}/>}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
          <div style={{fontWeight:600,fontSize:14,color:C.text,lineHeight:1.3}}>{tField(ex,"name")}</div>
          {badge&&<Tag color={DIFF_COLOR[ex.difficulty]||C.muted}>{badge}</Tag>}
        </div>
        <div style={{fontSize:11,color:C.muted,marginTop:3}}>{ex.group_icon_url?<img src={ex.group_icon_url} alt="" style={{width:14,height:14,objectFit:"cover",borderRadius:3,verticalAlign:"middle",marginRight:3}}/>:ex.group_emoji+" "}{tGroup(ex)}</div>
        <div style={{display:"flex",gap:10,marginTop:6}}>
          <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{ex.sets_recommended} {t("sets_short2")}</span>
          <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{ex.reps_recommended} {t("reps_short2")}</span>
          {ex.equipment&&<span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{tEquip(ex.equipment)}</span>}
        </div>
      </div>
      {action}
    </div>
  </Card>;
}



// ─── ONBOARDING ──────────────────────────────────────────────────────────────
function OnboardingScreen({tgId,tgUser,onComplete}){
  const [step,setStep]=useState(0);
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");
  const [name,setName]=useState(tgUser?.first_name||"");
  const [goal,setGoal]=useState("stay_healthy");

  async function finish(){
    if(!tgId){setErr(t("open_telegram"));return;}
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
    }catch(e){setErr(t("error_try_again"));setSaving(false);}
  }

  const goals=[
    {v:"lose_weight",icon:"⚖️",label:t("goal_lose")},
    {v:"gain_muscle",icon:"💪",label:t("goal_muscle")},
    {v:"gain_strength",icon:"🏋️",label:"Сила"},
    {v:"improve_endurance",icon:"🏃",label:t("goal_endurance")},
    {v:"stay_healthy",icon:"❤️",label:"Здоровье"},
  ];

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{height:3,background:C.border}}>
        <div style={{height:3,background:C.accent,width:step===0?"33%":step===1?"66%":"100%",transition:"width 0.3s"}}/>
      </div>
      <div style={{flex:1,padding:"32px 20px 24px",display:"flex",flexDirection:"column"}}>
        {step===0&&<Fragment>
          <div style={{fontFamily:"monospace",fontSize:10,color:C.muted,letterSpacing:2,marginBottom:16}}>ДОБРО ПОЖАЛОВАТЬ</div>
          <Hero style={{marginBottom:8}}>Твой личный AI-тренер 🤖</Hero>
          <div style={{fontSize:14,color:C.muted,marginBottom:28,lineHeight:1.5}}>
            Не просто список упражнений — тренер, который реально знает твою историю и подстраивается под тебя.
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14,flex:1}}>
            {[
              {icon:"📊",title:"Видит весь твой прогресс",desc:"Анализирует тренировки, веса, повторы — и советует, когда действительно пора прибавлять нагрузку"},
              {icon:"🍽",title:"Питание по фото",desc:"Сфотографировал еду — получил КБЖУ. Без ручного ввода каждого приёма пищи"},
              {icon:"💬",title:"Отвечает как живой тренер",desc:"Спроси что угодно про тренировку, восстановление, добавки — получишь конкретный ответ по твоим данным"},
              {icon:"🔥",title:"Держит мотивацию",desc:"Серии дней, достижения, честная обратная связь — без лишней сюсюканья"},
            ].map((f,i)=>(
              <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                <div style={{fontSize:26,flexShrink:0}}>{f.icon}</div>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:2}}>{f.title}</div>
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.4}}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <Btn accent full onClick={()=>setStep(1)} style={{marginTop:24}}>НАЧАТЬ ЗНАКОМСТВО →</Btn>
        </Fragment>}
        {step===1&&<Fragment>
          <div style={{fontFamily:"monospace",fontSize:10,color:C.muted,letterSpacing:2,marginBottom:16}}>{t("step_1_2")}</div>
          <Hero style={{marginBottom:8}}>{t("name_hint2")}</Hero>
          <div style={{fontSize:13,color:C.muted,marginBottom:28}}>{t("name_hint")}</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder={tgUser?.first_name||"Твоё имя"} maxLength={40} autoFocus
            style={{width:"100%",background:C.card,border:`1px solid ${(name||"").trim()?C.accent:C.border}`,borderRadius:10,padding:"14px 16px",color:C.text,fontSize:18,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          {err&&<div style={{marginTop:12,padding:"10px 14px",background:"rgba(255,68,68,0.1)",border:`1px solid ${C.danger}`,borderRadius:8,color:C.danger,fontSize:13}}>{err}</div>}
          <div style={{flex:1}}/>
          <Btn accent full onClick={()=>setStep(2)} style={{marginTop:24}}>{t("next_btn2")}</Btn>
        </Fragment>}
        {step===2&&<Fragment>
          <div style={{fontFamily:"monospace",fontSize:10,color:C.muted,letterSpacing:2,marginBottom:16}}>{t("step_2_2")}</div>
          <Hero style={{marginBottom:8}}>{t("goal_hint")}</Hero>
          <div style={{fontSize:13,color:C.muted,marginBottom:24}}>{t("ai_trainer_hint")}</div>
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
            <Btn onClick={()=>setStep(1)} style={{flex:1}}>{t("back")}</Btn>
            <Btn accent disabled={saving} onClick={finish} style={{flex:2}}>{saving?"ВХОДИМ...":"НАЧАТЬ 🏋️"}</Btn>
          </div>
        </Fragment>}
      </div>
    </div>
  );
}

// ─── MENU ─────────────────────────────────────────────────────────────────────
function MenuScreen({user,onNav,activeWorkout=false}){
  const streak=user?.true_streak_days||0;
  const [dayData,setDayData]=useState(null);
  const tgId=user?.telegram_id;
  const profileComplete=user?.profile_complete||false;

  useEffect(()=>{
    if(tgId){
      fetch(`${API}/nutrition/${tgId}`).then(r=>r.json()).then(d=>{
        const eaten=Math.round((d.today_totals?.kcal||0));
        fetch(`${API}/sport/${tgId}`).then(r=>r.json()).then(s=>{
          const todayStr=new Date().toISOString().slice(0,10);
          const sportBurned=Math.round((s.sessions||[]).filter(x=>x.session_date&&x.session_date.slice(0,10)===todayStr).reduce((a,x)=>a+(x.calories_burned||0),0));
          // Also fetch gym workout calories
          fetch(`${API}/workouts/${tgId}`).then(r=>r.json()).then(w=>{
            const gymBurned=Math.round((w.workouts||[]).filter(x=>x.date&&x.date.slice(0,10)===todayStr&&x.status==='finished').reduce((a,x)=>a+(x.calories_burned||0),0));
            setDayData({eaten,burned:sportBurned+gymBurned});
          }).catch(()=>setDayData({eaten,burned:sportBurned}));
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
    {label:"Достижения",icon:"🎖",s:"achievements"},
    {label:"Лидерборд",icon:"📊",s:"leaderboard"},
    {label:t("menu_referral"),icon:"🎁",s:"referral"},
    {label:t("menu_language"),icon:"🌐",s:"language"},
    {label:t("menu_support"),icon:"?",s:"support"},
  ];

  const calorieGoal=user?.desired_result==="lose_weight"?1600:user?.desired_result==="gain_muscle"?2800:2200;
  const burnGoal=400;

  return <div style={{padding:"16px 16px 100px"}}>
    <div style={{marginBottom:16}}>
      {streak>0&&<div style={{fontFamily:"monospace",fontSize:12,color:C.accent,marginBottom:8}}>🔥 {streak} {streak===1?t("streak_day1")||"ДЕНЬ":streak<5?t("streak_day24")||"ДНЯ":t("streak_days5")||"ДНЕЙ"} {t("streak_podryad")||"ПОДРЯД"}</div>}
      <Hero>{t("greeting_back")||"О,"} {t("greeting_back2")||"ТЫ ВЕРНУЛСЯ"}{user?.first_name?`, ${user.first_name.split(" ")[0].toUpperCase()}`:""}</Hero>
      {user?.desired_result&&<div style={{color:C.muted,fontSize:13,marginTop:6,fontFamily:"monospace"}}>{t("goal_section")||"ЦЕЛЬ"} · {getGoalLabel(user.desired_result)}</div>}

    </div>

    {/* Шкалы калорий */}
    <Card style={{marginBottom:16,padding:"14px 16px"}}>
      {/* Калории из еды */}
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
          <div style={{fontSize:11,fontFamily:"monospace",color:C.muted}}>{t("calories_food")}</div>
          <div style={{fontSize:13,fontWeight:600,color:C.text}}>{dayData?dayData.eaten:"-"} <span style={{fontSize:10,color:C.muted}}>/ {calorieGoal} ккал</span></div>
        </div>
        <div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden"}}>
          <div style={{height:6,borderRadius:3,background:dayData&&dayData.eaten>calorieGoal?"#FF6B6B":C.accent,width:`${dayData?Math.min((dayData.eaten/calorieGoal)*100,100):0}%`,transition:"width 0.6s ease"}}/>
        </div>
      </div>
      {/* Калории потрачено */}
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
          <div style={{fontSize:11,fontFamily:"monospace",color:C.muted}}>{t("burned_sport")}</div>
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
          <div style={{fontWeight:700,fontSize:14,color:C.accent}}>{t("continue_workout3")}</div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>{t("unfinished")}</div>
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
      <Kicker>{t("profile_section")}</Kicker>
      {!profileComplete&&<Card style={{marginTop:8,marginBottom:8,cursor:"pointer",border:`1px solid ${C.warn}`}} onClick={()=>onNav("profile")}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:20}}>⚠️</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:C.warn}}>{t("profile_fill")}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>{t("profile_fill_hint")}</div>
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
            <div style={{fontSize:10,color:C.muted,marginTop:2}}>{t("edit_arrow")}</div>
          </div>
        </div>
        <div style={{borderTop:`0.5px solid ${C.border}`,marginTop:10,paddingTop:10,display:"flex",gap:16}}>
          <div><div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>ИМТ</div><Mono>{user.bmi||"—"}</Mono></div>
          <div><div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>AI</div><Mono>{user.ai_requests_today||0}/{user.ai_daily_limit||5}</Mono></div>
          <div><div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{t("status_section")}</div><Mono size={11}>{user.rank_name||"🥉"}</Mono></div>
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
      <Kicker>{t("supps_label")}</Kicker>
      <button onClick={()=>setAdding(!adding)}
        style={{background:"none",border:`0.5px solid ${C.accent}`,borderRadius:6,padding:"3px 10px",
          color:C.accent,fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>
        {adding?"✕":"+ ДОБАВИТЬ"}
      </button>
    </div>
    {supps===null?<Loader text="ЗАГРУЗКА"/>:supps.length===0&&!adding?
      <div style={{color:C.muted,fontSize:12,fontFamily:"monospace",padding:"8px 0"}}>{t("not_specified2")}</div>:
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:adding?12:0}}>
        {supps.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:6,
          background:C.card,border:`0.5px solid ${C.border}`,borderRadius:20,padding:"5px 10px"}}>
          <span style={{fontSize:12,color:C.text}}>{tSport(s)||s.name}</span>
          {s.dose&&<span style={{fontSize:10,color:C.muted}}>{s.dose}</span>}
          <button onClick={()=>remove(s.id)}
            style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:12,padding:0,lineHeight:1}}>✕</button>
        </div>)}
      </div>}
    {adding&&<Card style={{marginTop:8}}>
      <Kicker>{t("quick_select")}</Kicker>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,margin:"8px 0 12px"}}>
        {COMMON.filter(n=>!alreadyAdded.has(n)).map(n=>(
          <button key={n} onClick={()=>add(n)}
            style={{padding:"5px 12px",borderRadius:20,fontSize:12,cursor:"pointer",
              background:C.card,border:`0.5px solid ${C.border}`,color:C.text}}>{n}</button>
        ))}
      </div>
      <Kicker>{t("manual_input")}</Kicker>
      <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
        placeholder={t("supp_name")}
        style={{width:"100%",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
          padding:"8px 12px",color:C.text,fontSize:13,outline:"none",
          boxSizing:"border-box",marginTop:6,marginBottom:6}}/>
      <div style={{display:"flex",gap:6,marginBottom:8}}>
        <input value={form.dose} onChange={e=>setForm(p=>({...p,dose:e.target.value}))}
          placeholder={t("supp_dose")}
          style={{flex:1,background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
            padding:"8px 10px",color:C.text,fontSize:12,outline:"none"}}/>
        <input value={form.timing} onChange={e=>setForm(p=>({...p,timing:e.target.value}))}
          placeholder={t("supp_timing")}
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
    }catch(e){alert(t("error_conn"));}finally{setSaving(false);}
  }

  const medNames=(user.medical_conditions||[]).filter(c=>c!=="none").map(c=>MEDICAL_LABELS[c]||c);
  const algNames=(user.allergies||[]).filter(a=>a!=="none").map(a=>ALLERGY_LABELS[a]||a);
  const aiLimit=user.ai_daily_limit||5;
  const rows=[{l:"Возраст",v:user.age?`${user.age} лет`:"—"},{l:"Вес",v:user.weight?`${user.weight} кг`:"—"},{l:"Рост",v:user.height?`${user.height} см`:"—"},{l:"ИМТ",v:user.bmi||"—"},{l:"Уровень",v:LEVEL_LABELS[user.fitness_level]||"—"},{l:"Цель",v:GOAL_LABELS[user.desired_result]||"—"},{l:"Язык",v:(user.lang||"ru").toUpperCase()},{l:"Стиль AI",v:{"bro":"🤙 Бро","mentor":"🧑‍🏫 Наставник","expert":"🎓 Эксперт"}[user.ai_tone]||"🎓 Эксперт"},{l:t("ai_today")||"AI сегодня",v:`${user.ai_requests_today||0}/${aiLimit}`},{l:"Статус",v:user.rank_name||"🥉"},{l:"Баллы",v:`${user.total_points||0} pts`}];

  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/>
    <Kicker>{t("my_profile")}</Kicker>
    <Hero>{user.first_name||"Атлет"}</Hero>
    {user.username&&<div style={{color:C.muted,fontSize:13,marginTop:4,fontFamily:"monospace"}}>@{user.username}</div>}
    <div style={{height:16}}/>
    {saved&&<div style={{background:"#00CC6622",border:`0.5px solid ${C.success}`,borderRadius:10,padding:"10px 14px",marginBottom:12,fontFamily:"monospace",fontSize:12,color:C.success}}>{t("status_saved")}</div>}
    {!editing?<>
      <Card style={{marginBottom:12}}>
        {rows.map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<rows.length-1?`0.5px solid ${C.border}`:"none"}}>
          <span style={{fontSize:13,color:C.muted,fontFamily:"monospace"}}>{r.l}</span>
          <span style={{fontSize:13,color:C.text,fontWeight:500}}>{r.v}</span>
        </div>)}
      </Card>
      <div style={{marginBottom:12}}>
        <Kicker>{t("med_label")}</Kicker>
        <Card>{medNames.length>0?<div style={{display:"flex",flexWrap:"wrap",gap:6}}>{medNames.map((n,i)=><Tag key={i} color={C.danger}>{n}</Tag>)}</div>:<span style={{fontSize:13,color:C.muted}}>{t("not_specified3")}</span>}</Card>
      </div>
      <div style={{marginBottom:16}}>
        <Kicker>{t("allergy_section")}</Kicker>
        <Card>{algNames.length>0?<div style={{display:"flex",flexWrap:"wrap",gap:6}}>{algNames.map((n,i)=><Tag key={i} color={C.warn}>{n}</Tag>)}</div>:<span style={{fontSize:13,color:C.muted}}>{t("not_specified3")}</span>}</Card>
      </div>
      <UserSupplementsBlock tgId={tgId}/>
      <Btn accent full onClick={startEdit}>{t("edit_profile_btn2")}</Btn>
    </>:<>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
        {[{label:"Возраст (лет)",key:"age",placeholder:"45"},{label:"Вес (кг)",key:"weight",placeholder:"86"},{label:"Рост (см)",key:"height",placeholder:"186"}].map(f=><Card key={f.key}>
          <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{f.label.toUpperCase()}</div>
          <input type="number" value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} style={{background:"none",border:"none",color:C.accent,fontSize:22,fontFamily:"monospace",fontWeight:700,width:"100%",outline:"none"}}/>
        </Card>)}
        <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ПОЛ</div><Sel value={form.gender} onChange={v=>setForm(p=>({...p,gender:v}))} options={[{value:"male",label:t("gender_male")},{value:"female",label:t("gender_female")}]}/></Card>
        <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("level_section")}</div><Sel value={form.fitness_level} onChange={v=>setForm(p=>({...p,fitness_level:v}))} options={[{value:"beginner",label:"Новичок"},{value:"intermediate",label:t("level_intermediate")},{value:"advanced",label:t("level_advanced")}]}/></Card>
        <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("goal_section")}</div><Sel value={form.desired_result} onChange={v=>setForm(p=>({...p,desired_result:v}))} options={[{value:"lose_weight",label:t("goal_lose")},{value:"gain_muscle",label:t("goal_muscle")},{value:"gain_strength",label:"Сила"},{value:"improve_endurance",label:t("goal_endurance")},{value:"stay_healthy",label:"Здоровье"}]}/></Card>
        <Card style={{marginBottom:12}}>
          <Kicker style={{marginBottom:10}}>{t("ai_style_label")}</Kicker>
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
          <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:10}}>{t("med_label")}</div>
          <CheckboxGroup options={MEDICAL_OPTIONS} selected={form.medical_conditions} onChange={v=>setForm(p=>({...p,medical_conditions:v}))}/>
          {form.medical_conditions.length===0&&<div style={{fontSize:11,color:C.muted,marginTop:8,fontFamily:"monospace"}}>{t("no_conditions2")}</div>}
        </Card>
        <Card>
          <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:10}}>{t("allergy_section")}</div>
          <CheckboxGroup options={ALLERGY_OPTIONS} selected={form.allergies} onChange={v=>setForm(p=>({...p,allergies:v}))}/>
          {form.allergies.length===0&&<div style={{fontSize:11,color:C.muted,marginTop:8,fontFamily:"monospace"}}>{t("no_allergies2")}</div>}
        </Card>
      </div>
      <div style={{display:"flex",gap:10}}>
        <Btn full onClick={()=>setEditing(false)} style={{flex:1}}>{t("cancel_btn2")}</Btn>
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
    if(!window.confirm(t("delete_confirm")))return;
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
          <Kicker>{t("notes_section")}</Kicker>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)}
            placeholder="Партнёры, ощущения..."
            style={{width:"100%",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
              padding:"8px 12px",color:C.text,fontSize:13,outline:"none",resize:"none",
              minHeight:50,fontFamily:"inherit",boxSizing:"border-box",marginTop:6}}/>
        </div>

        <div style={{display:"flex",gap:8}}>
          <Btn full onClick={del} disabled={saving} style={{flex:1,color:C.danger,border:`0.5px solid ${C.danger}`}}>{t("delete_btn")}</Btn>
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
      if(!res.ok){setErr(t("error_save"));return;}
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
    }catch{setErr(t("error_net"));}
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
      <Kicker>{t("my_exercise_section")}</Kicker>
      <input value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}
        placeholder={t("name_req")}
        style={{width:"100%",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
          padding:"8px 12px",color:C.text,fontSize:13,outline:"none",
          marginBottom:8,boxSizing:"border-box",marginTop:8}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
        <select value={f.muscle_group_id} onChange={e=>setF(p=>({...p,muscle_group_id:e.target.value}))}
          style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px 10px",
            color:C.text,fontSize:12,outline:"none"}}>
          <option value="">{t("exercise_group")}</option>
          {(muscleGroups||[]).map(g=><option key={g.id} value={g.id}>{g.emoji} {tGroup(g)||g.name}</option>)}
        </select>
        <select value={f.difficulty} onChange={e=>setF(p=>({...p,difficulty:e.target.value}))}
          style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px 10px",
            color:C.text,fontSize:12,outline:"none"}}>
          <option value="easy">{t("difficulty_easy")}</option>
          <option value="medium">{t("difficulty_medium")}</option>
          <option value="hard">{t("difficulty_hard")}</option>
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
        <Btn full onClick={()=>setOpen(false)} style={{flex:1}}>{t("cancel_btn2")}</Btn>
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
    (!search||(e.name.toLowerCase().includes(search.toLowerCase())||(tField(e,"name")||"").toLowerCase().includes(search.toLowerCase())))
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
        <Kicker>{t("add_exercise_btn")}</Kicker>
        <button onClick={()=>{setOpen(false);setSearch("");setGroupId(null);}}
          style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)}
        placeholder={t("search_placeholder2")}
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
              color:groupId===g.id?C.bg:C.muted,fontFamily:"monospace",display:"inline-flex",alignItems:"center",gap:4}}>
            {g.icon_url?<img src={g.icon_url} alt="" style={{width:14,height:14,objectFit:"cover",borderRadius:3}}/>:g.emoji}
          </button>
        ))}
      </div>
      <div style={{maxHeight:200,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
        {filtered.map(ex=>(
          <button key={ex.id} onClick={()=>{onAdd(ex);setOpen(false);setSearch("");setGroupId(null);}}
            style={{width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,
              padding:"8px 10px",color:C.text,fontSize:12,cursor:"pointer",textAlign:"left",
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontWeight:600}}>{tField(ex,"name")}</div>
              <div style={{fontSize:10,color:C.muted}}>{ex.group_icon_url?<img src={ex.group_icon_url} alt="" style={{width:13,height:13,objectFit:"cover",borderRadius:3,verticalAlign:"middle",marginRight:3}}/>:ex.group_emoji+" "}{tGroup(ex)}</div>
            </div>
            <span style={{color:C.accent,fontSize:16,flexShrink:0}}>+</span>
          </button>
        ))}
        {filtered.length===0&&<div style={{textAlign:"center",color:C.muted,fontSize:12,padding:12}}>{t("not_found_hint")}</div>}
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
                   <div style={{color:C.text}}>{tField(ex,"name")}</div>
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
      if(res.status===409){setErr(t("product_exists"));return;}
      if(!res.ok){setErr(t("error_save"));return;}
      const d=await res.json();
      onAdded({
        id:d.id,name:f.name.trim(),calories:parseFloat(f.calories)||0,
        protein:parseFloat(f.protein)||0,fat:parseFloat(f.fat)||0,
        carbs:parseFloat(f.carbs)||0,fiber:parseFloat(f.fiber)||0,
        category:f.category,is_custom:true,is_verified:false,
      });
      setOpen(false);
      setF({name:"",calories:"",protein:"",fat:"",carbs:"",fiber:"",category:"meat"});
    }catch{setErr(t("error_net"));}
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
      <Kicker>{t("new_product_section")}</Kicker>
      <input value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}
        placeholder={t("product_name")}
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
        <Btn full onClick={()=>setOpen(false)} style={{flex:1}}>{t("cancel_btn2")}</Btn>
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
    {hasResumableActiveWorkout()&&<Card accent style={{marginBottom:8,cursor:"pointer"}} onClick={()=>onNav("active_workout")}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:24}}>▶</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:14,color:C.accent}}>{t("continue_workout3")}</div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>{t("unfinished")}</div>
        </div>
        <span style={{color:C.accent}}>→</span>
      </div>
    </Card>}
    {activeTab!=="sport"&&!hasResumableActiveWorkout()&&<Btn accent full onClick={()=>onNav("active_workout")} style={{marginBottom:16}}>{t("start_workout")}</Btn>}

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
              <div style={{textAlign:"right"}}><Mono>{w.sets_count||0}</Mono><span style={{fontSize:11,color:C.muted}}> {t("sets_short2")}</span></div>
            </div>
            <div style={{borderTop:`0.5px solid ${C.border}`,marginTop:10,paddingTop:10,display:"flex",gap:20}}>
              <div><div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{t("tonnage_section")}</div><Mono>{Math.round((w.total_volume||0)/1000*10)/10}</Mono><span style={{fontSize:11,color:C.muted}}> т</span></div>
              <div><div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{t("status_section")}</div><span style={{fontSize:12,fontFamily:"monospace",color:w.status==="finished"?C.success:C.muted}}>{w.status==="finished"?"✓ ЗАВЕРШЕНА":w.status||"—"}</span></div>
            </div>
            <div style={{marginTop:8,fontSize:11,color:C.accent,fontFamily:"monospace"}}>{t("open_plan")}</div>
          </Card>)}
        </div>
    )}

    {activeTab==="sport"&&(
      <Fragment>
        <Btn accent full onClick={()=>onNav("sport_log",{})} style={{marginBottom:12}}>{t("record_sport")}</Btn>
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
                    <span style={{fontSize:10,color:C.accent,fontFamily:"monospace"}}>{t("edit_arrow")}</span>
                    <button onClick={e=>{e.stopPropagation();delSport(s.id);}} disabled={deleting===s.id}
                      style={{background:"none",border:`0.5px solid ${C.danger}`,borderRadius:6,padding:"3px 8px",color:C.danger,fontSize:11,cursor:"pointer",flexShrink:0}}>
                      {deleting===s.id?"...":"✕"}
                    </button>
                  </div>
                </div>
                <div style={{borderTop:`0.5px solid ${C.border}`,marginTop:8,paddingTop:8,display:"flex",gap:16,flexWrap:"wrap"}}>
                  <div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>{t("time_label2")}</div><Mono size={13}>{s.duration_min} мин</Mono></div>
                  <div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>{t("sport_intensity")}</div><span style={{fontSize:12,fontFamily:"monospace",color:intensityColor[s.intensity]||C.muted}}>{intensityLabel[s.intensity]||s.intensity}</span></div>
                  {s.calories_burned>0&&<div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>{t("calories_section")}</div><Mono size={13}>{s.calories_burned} ккал</Mono></div>}
                  {s.score&&<div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>{t("score_section")}</div><Mono size={13}>{s.score}</Mono></div>}
                </div>
                {s.notes&&<div style={{fontSize:12,color:C.muted,marginTop:6}}>{s.notes}</div>}
              </Card>
             ))}
             {past.length>0&&<>
               <div style={{marginTop:12,marginBottom:6}}><Kicker>{t("archive_section")}</Kicker></div>
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
          <div style={{marginTop:8,fontSize:11,color:C.accent,fontFamily:"monospace"}}>{t("open_plan")}</div>
        </Card>)}
        <Btn full onClick={()=>onNav("plan_workout")} style={{marginTop:8}}>{t("add_plan2")}</Btn>
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
    <Kicker>{t("error_label2")}</Kicker>
    <Hero style={{fontSize:20}}>{t("failed_load2")}</Hero>
    <div style={{height:16}}/>
    <Card danger>
      <div style={{fontSize:13,color:C.danger,fontFamily:"monospace",lineHeight:1.6}}>
        Тренировка не найдена или нет доступа.<br/>
        Попробуй открыть через Telegram-бот.
      </div>
    </Card>
    <Btn full onClick={onBack} style={{marginTop:16}}>{t("back")}</Btn>
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
    {isActive&&<div style={{background:"#FFB80022",border:`0.5px solid ${C.warn}`,borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:12,color:C.warn,fontFamily:"monospace"}}>{t("workout_still_active")}</div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
      {[{l:t("sets_label"),v:totalSets},{l:t("tonnage_label2"),v:`${Math.round((data.total_volume||0)/1000*10)/10} т`},{l:"СТАТУС",v:data.status==="finished"?"✓":data.status||"—"}].map((s,i)=><Card key={i} style={{textAlign:"center"}}><div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:4}}>{s.l}</div><Mono size={14}>{s.v}</Mono></Card>)}
    </div>

    {data.exercises?.length===0&&<Card><div style={{textAlign:"center",padding:"16px 0",color:C.muted}}>{t("no_sets")}</div></Card>}

    {data.exercises?.map((ex,i)=><Card key={i} style={{marginBottom:10}}>
      <div style={{fontWeight:700,fontSize:15,color:C.text,marginBottom:10}}>{i+1}. {tField(ex,"name")}</div>
      <div style={{display:"grid",gridTemplateColumns:"auto 1fr 1fr 1fr",gap:"4px 12px",alignItems:"center"}}>
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>ПХ</div>
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>ВЕС</div>
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{t("reps_short2")}</div>
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
      <Kicker>{t("ai_coach_advice")}</Kicker>
      <div style={{fontSize:13,color:C.text,lineHeight:1.6,marginTop:8,whiteSpace:"pre-wrap"}}>{data.ai_review}</div>
    </Card>}
  </div>;
}

// ─── ACTIVE WORKOUT ───────────────────────────────────────────────────────────
function ActiveWorkoutScreen({tgId,exercises,muscleGroups,onBack,onFinish,onFinishNav=null,onNav=null,preselectedExIds=[],plannedWorkoutId=null,exerciseTips={}}){
  const STEP={MD:-1,SG:0,SE:1,WU:2,OR:3,LG:4,FN:5}; // MD=выбор режима
  // Если все упражнения кардио — пропускаем разминку
  const _allCardio=preselectedExIds?.length>0&&exercises?.length>0&&
    preselectedExIds.every(id=>{const ex=exercises?.find(e=>e.id===id);return ex?.muscle_group_id===9;});
  const initStep=preselectedExIds?.length>0?(_allCardio?3:2):-1;
  // Восстанавливаем сохранённое состояние тренировки
  const _saved=()=>{try{const s=localStorage.getItem("gymbot_active_workout");return s?JSON.parse(s):null;}catch{return null;}};
  const _sv=_saved();
  // Если пришли из запланированной тренировки — localStorage-состояние не применяем,
  // чтобы не перекрыть preselectedExIds сохранённым состоянием предыдущей сессии.
  // Также сразу синхронно вычисляем selExs из preselectedExIds + exercises,
  // чтобы избежать race condition (useState синхронен, useEffect — нет).
  const _initSelExs=(()=>{
    if(plannedWorkoutId&&preselectedExIds?.length>0&&exercises?.length>0){
      const preEx=preselectedExIds
        .map((id,i)=>{const ex=(exercises||[]).find(e=>e.id===id);return ex?{...ex,order:i+1}:null;})
        .filter(Boolean);
      if(preEx.length>0)return preEx;
    }
    return null; // вернём null — значит используем localStorage или пустой массив
  })();
  const _useSaved=!!_sv&&!plannedWorkoutId;
  const [step,setStep]=useState(_useSaved?_sv.step:initStep);
  const [showSports,setShowSports]=useState(false); // Виды спорта свёрнуты по умолчанию — зал теперь основной
  const [selGroups,setSelGroups]=useState(new Set()); // мультивыбор групп
  const [selExs,setSelExs]=useState(_initSelExs||(_useSaved?_sv.selExs:[]));
  const [warmup,setWarmup]=useState(_useSaved?_sv.warmup:null);
  const [warmupDone,setWarmupDone]=useState(_useSaved?_sv.warmupDone:false);
  const [workoutId,setWorkoutId]=useState(_useSaved?_sv.workoutId:null);
  const [curIdx,setCurIdx]=useState(_useSaved?_sv.curIdx:0);
  const [exTips,setExTips]=useState(_useSaved?(_sv.exerciseTips||{}):(exerciseTips||{}));
  const [lastSets,setLastSets]=useState({}); // {exerciseId: {found, date, sets:[{weight,reps}]}} — fallback когда нет совета AI

  useEffect(()=>{
    const curEx=selExs[curIdx];
    if(!curEx||!tgId)return;
    if(exTips[curEx.id])return; // есть совет AI — fallback не нужен
    if(lastSets[curEx.id]!==undefined)return; // уже загружено (или уже пробовали и не нашли)
    const exName=curEx.name;
    if(!exName)return;
    fetch(`${API}/exercises/${tgId}/last-sets?exercise_name=${encodeURIComponent(exName)}`)
      .then(r=>r.json())
      .then(d=>setLastSets(prev=>({...prev,[curEx.id]:d})))
      .catch(()=>setLastSets(prev=>({...prev,[curEx.id]:{found:false}})));
  },[curIdx,selExs,tgId,exTips]);
  const [sets,setSets]=useState(_useSaved?(_sv.sets||{}):{});
  const [startTime]=useState(_useSaved?(_sv.startTime||Date.now()):Date.now());
  const [resumeBanner,setResumeBanner]=useState(_useSaved&&(_sv.workoutId||_sv.selExs?.length>0));
  const [exSearch,setExSearch]=useState("");
  const [replaceIdx,setReplaceIdx]=useState(null);
  const [localSet,setLocalSet]=useState({reps:"",weight:"",time:"",distance:""});
  const [logBusy,setLogBusy]=useState(false); // B-04: блокировка двойного нажатия
  const [lgReplaceMode,setLgReplaceMode]=useState(false); // B-07: замена упражнения
  const [aiReview,setAiReview]=useState(null); // B-06: AI оценка (null=загрузка, ""=ошибка)
  const [streakInfo,setStreakInfo]=useState(null); // {streak_days, new_streak_rewards: [{days,name,emoji,pts,desc}]}
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
          plannedWorkoutId,exerciseTips:exTips,savedAt:Date.now(),
        }));
      }catch{}
    }
  },[step,curIdx,sets,workoutId,selExs.length]);

  // Защита от повреждённого восстановленного состояния: если мы на экране логирования (LG),
  // но selExs пуст или curIdx указывает за пределы массива — вместо немого чёрного экрана
  // чистим localStorage и возвращаем пользователя назад
  useEffect(()=>{
    if(step===STEP.LG&&!selExs[curIdx]){
      try{localStorage.removeItem("gymbot_active_workout");}catch{}
      if(onBack)onBack();
    }
  },[step,curIdx,selExs.length]);
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
        try{
          const fd=await fr.json();
          setStreakInfo({
            streak_days:fd.streak_days||0,
            new_streak_rewards:fd.new_streak_rewards||[],
          });
        }catch{}
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
        return `${i+1}. ${tField(e,"name")}: ${setsStr||t("no_sets_data")}`;
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

      {streakInfo?.new_streak_rewards?.length>0&&streakInfo.new_streak_rewards.map((r,i)=>(
        <Card key={i} accent style={{marginBottom:16,textAlign:"center",background:"linear-gradient(135deg,rgba(200,255,0,0.12),rgba(200,255,0,0.03))"}}>
          <div style={{fontSize:36,marginBottom:4}}>{r.emoji}</div>
          <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:4}}>{r.name}!</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:4}}>{r.desc}</div>
          <div style={{fontSize:13,color:C.accent,fontFamily:"monospace"}}>+{r.pts} баллов за серию</div>
        </Card>
      ))}
      {streakInfo&&!(streakInfo.new_streak_rewards?.length>0)&&streakInfo.streak_days>1&&(
        <div style={{textAlign:"center",marginBottom:16,fontFamily:"monospace",fontSize:13,color:C.muted}}>
          🔥 Серия: {streakInfo.streak_days} {streakInfo.streak_days<5?"дня":"дней"} подряд
        </div>
      )}

      {/* Итоги */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
        {[
          {l:t("exercises_label"),v:selExs.length},
          {l:t("sets_label"),v:Object.values(sets).reduce((s,a)=>s+a.length,0)},
          {l:"МИНУТ",v:Math.round((Date.now()-startTime)/60000)},
        ].map((s,i)=><Card key={i} style={{textAlign:"center"}}><div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:4}}>{s.l}</div><Mono size={18}>{s.v}</Mono></Card>)}
      </div>

      {/* B-06: AI оценка тренировки */}
      {aiReview===null?(
        <Card accent style={{marginBottom:16}}>
          <Kicker>{t("ai_trainer_title")}</Kicker>
          <div style={{textAlign:"center",padding:"12px 0"}}>
            <div style={{color:C.accent,fontFamily:"monospace",fontSize:12,letterSpacing:2}}>{t("analyzing")}</div>
            <div style={{color:C.muted,fontSize:24,marginTop:8}}>◌</div>
          </div>
        </Card>
      ):aiReview&&aiReview!=="__limit__"&&aiReview!=="__error__"?(
        <Card accent style={{marginBottom:16}}>
          <Kicker>{t("ai_review_title")}</Kicker>
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

      <Btn accent full onClick={()=>{if(onFinishNav)onFinishNav();else onBack();}} style={{marginTop:8}}>{t("back_to_menu")}</Btn>
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
      <div style={{fontWeight:700,fontSize:16,color:C.text,marginBottom:10}}>
        <span style={{fontSize:22,marginRight:8}}>🏋️</span>{t("gym_title")}
      </div>
      <div style={{fontSize:12,color:C.muted,marginBottom:12}}>{t("gym_desc")}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
        {(muscleGroups||[]).filter(g=>g.id!==9).map(g=>(
          <div key={g.id} onClick={()=>{setSelGroups(new Set([g.id]));setStep(STEP.SG);}}
            style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:12,padding:"14px 6px",textAlign:"center",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            {g.icon_url?<img src={g.icon_url} alt="" style={{width:28,height:28,objectFit:"cover",borderRadius:6}}/>:<div style={{fontSize:24}}>{g.emoji}</div>}
            <div style={{fontSize:9,fontFamily:"monospace",fontWeight:700,color:C.text,lineHeight:1.2}}>{(tGroup(g)||g.name).toUpperCase()}</div>
          </div>
        ))}
      </div>
      <Card onClick={()=>{setSelGroups(new Set());setStep(STEP.SE);}} style={{marginBottom:12,cursor:"pointer",padding:"12px 16px",textAlign:"center"}}>
        <span style={{color:C.accent,fontSize:13,fontFamily:"monospace",fontWeight:700}}>{t("show_all_exercises")} →</span>
      </Card>
      {!showSports?(
        <Card onClick={()=>setShowSports(true)} style={{cursor:"pointer",padding:"20px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <span style={{fontSize:40}}>⚽</span>
            <div>
              <div style={{fontWeight:700,fontSize:17,color:C.text,marginBottom:4}}>{t("sport_section_title")}</div>
              <div style={{fontSize:13,color:C.muted}}>{t("sport_section_desc")}</div>
            </div>
            <span style={{color:C.accent,fontSize:20,marginLeft:"auto"}}>→</span>
          </div>
        </Card>
      ):(
      <Card style={{cursor:"pointer",padding:"20px 16px"}}>
        <div style={{fontWeight:700,fontSize:17,color:C.text,marginBottom:12}}>
          <span style={{fontSize:24,marginRight:10}}>⚽</span>{t("sport_section_title")}
        </div>
        <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{t("sport_section_desc")}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {(sports.length?sports:[
            {code:"football",name:"⚽ Футбол"},{code:"volleyball",name:"🏐 Волейбол"},
            {code:"basketball",name:"🏀 Баскетбол"},{code:"handball",name:"🤾 Гандбол"},
            {code:"table_tennis",name:"🏓 Настольный теннис"},{code:"padel",name:"🎾 Падел"},
            {code:"tennis",name:"🎾 Большой теннис"},{code:"badminton",name:"🏸 Бадминтон"},
            {code:"boxing",name:"🥊 Бокс"},{code:"mma",name:"🥋 MMA"},
            {code:"swimming",name:"🏊 Плавание"},{code:"cycling",name:"🚴 Велоспорт"},
            {code:"running",name:"🏃 Бег"},{code:"crossfit",name:"🏋️ CrossFit"},
            {code:"yoga",name:"🧘 Йога"},{code:"pilates",name:"🧘 Пилатес"},
            {code:"skiing",name:"⛷ Горные лыжи"},{code:"climbing",name:"🧗 Скалолазание"},
          ]).map(s=>(
            <button key={s.code||s.v} onClick={()=>{
              if(onNav){onNav("sport_log",{initial_sport:s.code||s.v});}else{onBack();}
            }}
              style={{padding:"8px 14px",borderRadius:20,fontSize:13,cursor:"pointer",
                background:C.card,border:`0.5px solid ${C.border}`,color:C.text}}>
              {tSport(s)||s.name}
            </button>
          ))}
        </div>
        <div style={{marginTop:12,fontSize:11,color:C.muted,fontFamily:"monospace"}}>
          ↗ Полная запись в разделе Тренировки → ⚽ Спорт
        </div>
      </Card>
      )}
    </div>
  );

  if(step===STEP.SG)return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={()=>setStep(STEP.MD)}/>
      <Kicker>{t("step_1_4b")}</Kicker><Hero>{t("muscles_title")}</Hero>
      <div style={{fontSize:13,color:C.muted,marginTop:8,marginBottom:16}}>{t("select_groups_hint")}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
        {muscleGroups?.map(g=>{
          const sel=selGroups.has(g.id);
          return(
            <div key={g.id} onClick={()=>{setSelGroups(prev=>{const n=new Set(prev);if(n.has(g.id))n.delete(g.id);else n.add(g.id);return n;}); setExSearch("");}}
              style={{position:"relative",background:sel?C.accent:C.card,border:`0.5px solid ${sel?C.accent:C.border}`,borderRadius:12,padding:"14px 6px",textAlign:"center",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              {sel&&<span style={{position:"absolute",top:6,right:6,width:16,height:16,borderRadius:4,background:C.bg,color:C.accent,fontSize:11,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>✓</span>}
              {g.icon_url?<img src={g.icon_url} alt="" style={{width:32,height:32,objectFit:"cover",borderRadius:6}}/>:<div style={{fontSize:26}}>{g.emoji}</div>}
              <div style={{fontSize:10,fontFamily:"monospace",fontWeight:700,color:sel?C.bg:C.text,lineHeight:1.2}}>{(tGroup(g)||g.name).toUpperCase()}</div>
            </div>
          );
        })}
      </div>
      {selGroups.size>0&&(
        <div style={{marginBottom:12,fontFamily:"monospace",fontSize:11,color:C.accent}}>
          ВЫБРАНО ГРУПП: {selGroups.size} · {(muscleGroups||[]).filter(g=>selGroups.has(g.id)).map(g=>g.emoji+(tGroup(g)||g.name)).join(", ")}
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
        <Kicker>{t("replace_title")}</Kicker><Hero>{t("choose_replacement")}</Hero><div style={{height:12}}/>
        {filteredEx.slice(0,30).map(ex=><ExCard key={ex.id} ex={ex} badge={getDiff(ex.difficulty)} onClick={()=>doReplace(replaceIdx,ex)}/>)}
      </div>
    );
    return(
      <div style={{padding:"16px 16px 100px"}}>
        <BackBtn onBack={stepBack}/>
        <Kicker>{t("step_2_4b")}</Kicker><Hero>{t("exercises_section")}</Hero>
        <input value={exSearch} onChange={e=>setExSearch(e.target.value)} placeholder={t("search_placeholder")} style={{width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:13,fontFamily:"monospace",outline:"none",boxSizing:"border-box",marginTop:12,marginBottom:12}}/>
        {selExs.length>0&&(
          <div style={{marginBottom:12}}>
            <Kicker>ВЫБРАНО ({selExs.length})</Kicker>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {selExs.map((e,i)=><Tag key={e.id} color={C.accent}>{i+1}. {e.name.split(" ").slice(0,2).join(" ")}</Tag>)}
            </div>
          </div>
        )}
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{filteredEx.length}  {t("exercises_label")}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {filteredEx.slice(0,50).map(ex=>{
            const sel=selExs.find(e=>e.id===ex.id);
            return <ExerciseSelectCard key={ex.id} ex={ex} sel={sel} onToggle={()=>toggleEx(ex)}/>;
          })}
        </div>
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
      <Kicker>{t("step_3_4b")}</Kicker><Hero>{t("warmup_title")}</Hero>
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
      <Kicker>{t("step_4_4b")}</Kicker><Hero>{t("order_section")}</Hero>
      <div style={{fontSize:13,color:C.muted,marginTop:8,marginBottom:16}}>{t("order_hint")}</div>
      {warmup&&<Card accent style={{marginBottom:12}}><div style={{fontSize:12,color:C.accent,fontFamily:"monospace",marginBottom:4}}>{t("warmup_badge3")}</div><div style={{fontWeight:600,color:C.text}}>{warmup.name}</div></Card>}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        {selExs.map((ex,i)=>(
          <Card key={ex.id}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <Mono color={C.accent} size={20}>{i+1}</Mono>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14,color:C.text}}>{tField(ex,"name")}</div>
                <div style={{fontSize:11,color:C.muted}}>{ex.group_icon_url?<img src={ex.group_icon_url} alt="" style={{width:14,height:14,objectFit:"cover",borderRadius:3,verticalAlign:"middle",marginRight:3}}/>:ex.group_emoji+" "}{tGroup(ex)}</div>
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
          <Kicker>{t("warmup_badge3")}</Kicker>
          <button onClick={finish} style={{background:"none",border:`0.5px solid ${C.danger}`,borderRadius:8,padding:"5px 10px",color:C.danger,fontSize:11,fontFamily:"monospace",cursor:"pointer"}}>{t("finish_workout")}</button>
        </div>
        {warmup.photo_url&&<img src={warmup.photo_url} alt="" style={{width:"100%",borderRadius:12,marginBottom:12,maxHeight:180,objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>}
        <Hero style={{fontSize:20,marginBottom:4}}>{warmup.name}</Hero>
        <div style={{fontSize:13,color:C.muted,marginBottom:20}}>{t("warmup_exec_hint")}</div>
        <Card accent style={{marginBottom:16,padding:"16px",textAlign:"center"}}>
          <div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("warmup_rec_time")}</div>
          <div style={{fontSize:32,fontFamily:"monospace",fontWeight:700,color:C.accent}}>{t("rest_5_10")}</div>
        </Card>
        <Btn accent full onClick={()=>setWarmupDone(true)} style={{marginBottom:10}}>{t("warmup_done2")}</Btn>
        <Btn full onClick={()=>setWarmupDone(true)}>{t("skip_warmup2")}</Btn>
      </div>
    );}

    const ex=selExs[curIdx];
    if(!ex){
      return(
        <div style={{padding:"16px 16px 100px",textAlign:"center"}}>
          <div style={{fontSize:13,color:C.muted,marginTop:40}}>{t("loading")||"Загрузка..."}</div>
        </div>
      );
    }
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
            {ex.group_icon_url?<img src={ex.group_icon_url} alt="" style={{width:16,height:16,objectFit:"cover",borderRadius:3,verticalAlign:"middle",marginRight:4}}/>:ex.group_emoji+" "}{ex.group_name?.toUpperCase()}
          </div>
          <button onClick={finish} style={{background:"none",border:`0.5px solid ${C.danger}`,borderRadius:8,padding:"5px 10px",color:C.danger,fontSize:11,fontFamily:"monospace",cursor:"pointer"}}>
            ЗАВЕРШИТЬ
          </button>
        </div>

        {/* B-07: Название + кнопка замены */}
        {lgReplaceMode?(
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <Kicker>{t("replace_exercise2")}</Kicker>
              <button onClick={()=>setLgReplaceMode(false)} style={{background:"none",border:`0.5px solid ${C.border}`,borderRadius:8,padding:"4px 10px",color:C.muted,fontSize:12,cursor:"pointer"}}>{t("cancel_btn2")}</button>
            </div>
            <div style={{fontSize:12,color:C.muted,marginBottom:10}}>{ex.group_icon_url?<img src={ex.group_icon_url} alt="" style={{width:14,height:14,objectFit:"cover",borderRadius:3,verticalAlign:"middle",marginRight:3}}/>:ex.group_emoji+" "}{tGroup(ex)} — выбери замену:</div>
            {(exercises||[]).filter(e=>e.muscle_group_id===ex.muscle_group_id&&e.id!==ex.id).slice(0,15).map(alt=>(
              <ExCard key={alt.id} ex={alt} badge={getDiff(alt.difficulty)}
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
              <Hero style={{fontSize:22,flex:1}}>{tField(ex,"name")}</Hero>
              <button onClick={()=>setLgReplaceMode(true)} style={{background:"rgba(200,255,0,0.15)",border:`0.5px solid ${C.accent}`,borderRadius:8,padding:"6px 12px",color:C.accent,fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0,marginLeft:8,fontFamily:"monospace"}}>{t("do_replace2")}</button>
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
                <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("time_min_section")}</div>
                <input type="number" value={localSet.time} onChange={e=>setLocalSet(p=>({...p,time:e.target.value}))} placeholder="0"
                  style={{background:"none",border:"none",color:C.accent,fontSize:32,fontFamily:"monospace",fontWeight:700,width:"100%",outline:"none",textAlign:"center"}}/>
              </div>
              <div style={{width:1,background:C.border}}/>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("dist_short")}</div>
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
        {/* Кнопка "Добавить упражнение" отрендерена один раз ниже, после точек-индикаторов —
            здесь раньше был дублирующий вызов с опечаткой в проп-имени (allEx вместо allExercises) */}

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

        {/* Совет AI-тренера по текущему упражнению — только если план создавал AI и совет был дан именно на это упражнение */}
        {exTips[ex.id]?(
          <Card style={{marginBottom:10,background:"rgba(200,255,0,0.06)",border:`0.5px solid ${C.accent}`}}>
            <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
              <div style={{fontSize:18}}>🤖</div>
              <div style={{flex:1,fontSize:13,color:C.text,lineHeight:1.5}}>{exTips[ex.id]}</div>
            </div>
          </Card>
        ):lastSets[ex.id]?.found&&(
          <Card style={{marginBottom:10}}>
            <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
              <div style={{fontSize:18}}>📊</div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:4,fontFamily:"monospace"}}>
                  ПОСЛЕДНИЙ РАЗ ({lastSets[ex.id].date})
                </div>
                <div style={{fontSize:13,color:C.text}}>
                  {lastSets[ex.id].sets.map((s,i)=>(s.weight>0?`${s.weight}кг×${s.reps}`:`${s.reps}повт`)).join(", ")}
                </div>
              </div>
            </div>
          </Card>
        )}

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
    <BackBtn onBack={onBack}/><Kicker>{t("schedule_label")}</Kicker><Hero>{t("my_workouts_title")}</Hero>
    <div style={{height:16}}/>
    <Kicker>{t("upcoming_label")}</Kicker>
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
        <div style={{marginTop:8,fontSize:11,color:C.accent,fontFamily:"monospace"}}>{t("open_plan")}</div>
      </Card>)}
    </div>}
    {data.archive.length>0&&<><Kicker>{t("archive_section")}</Kicker><div style={{display:"flex",flexDirection:"column",gap:8}}>
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
    <BackBtn onBack={onBack}/><Kicker>{t("scheduled_workout")}</Kicker>
    {!editing?<>
      <Hero>{data.title||"Тренировка"}</Hero>
      <div style={{fontSize:13,color:C.accent,fontFamily:"monospace",marginTop:6,marginBottom:16}}>📅 {dt}</div>
      {!readOnly&&data?.status==="scheduled"&&<>
        <Btn accent full onClick={()=>onNav&&onNav("active_workout",{
          preselectedExIds: data.exercises?.map(e=>e.id)||[],
          plannedWorkoutId: pwId,
          exerciseTips: Object.fromEntries((data.exercises||[]).filter(e=>e.ai_tip).map(e=>[e.id,e.ai_tip])),
        })} style={{marginBottom:10}}>{t("start_workout")}</Btn>
        <Btn full onClick={()=>{setEditing(true);setEditExIds(data.exercises?.map(e=>e.id)||[]);setExSearch("");}} style={{marginBottom:16}}>{t("edit_date_plan")}</Btn>
      </>}
      {(readOnly||data?.status==="completed"||data?.status==="missed")&&<Card style={{marginBottom:12,background:data?.status==="completed"?"#00CC6611":"#FF444411",border:`0.5px solid ${data?.status==="completed"?C.success:C.danger}`}}><div style={{fontSize:13,color:data?.status==="completed"?C.success:C.danger,fontFamily:"monospace"}}>{data?.status==="completed"?"✓ ВЫПОЛНЕНА":"📋 АРХИВНАЯ · "+(data.status||"missed").toUpperCase()+" · ТОЛЬКО ПРОСМОТР"}</div></Card>}
      {data.exercises?.length===0?<Card><div style={{textAlign:"center",padding:"16px 0",color:C.muted}}>{readOnly?t("exercises_none_planned"):t("exercises_none")}</div></Card>:
      <><Kicker>УПРАЖНЕНИЯ ({data.exercises?.length})</Kicker>
      {data.exercises?.map(ex=><Card key={ex.id} style={{marginBottom:8}}>
        <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
          <Mono color={C.accent} size={20}>{ex.order}</Mono>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:14,color:C.text}}>{tField(ex,"name")}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{ex.group_icon_url?<img src={ex.group_icon_url} alt="" style={{width:14,height:14,objectFit:"cover",borderRadius:3,verticalAlign:"middle",marginRight:3}}/>:ex.group_emoji+" "}{tGroup(ex)}</div>
            <div style={{display:"flex",gap:10,marginTop:6}}>
              <Tag color={DIFF_COLOR[ex.difficulty]||C.muted}>{getDiff(ex.difficulty)}</Tag>
              <span style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>{ex.sets_recommended}×{ex.reps_recommended}</span>
            </div>
            {ex.description&&<div style={{fontSize:12,color:C.muted,marginTop:6,lineHeight:1.5}}>{ex.description}</div>}
          </div>
        </div>
      </Card>)}</>}
    </>:<>
      <Hero>{t("edit_btn")}</Hero>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:16,marginBottom:16}}>
        <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("name_section")}</div><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} style={{background:"none",border:"none",color:C.text,fontSize:16,width:"100%",outline:"none"}}/></Card>
        <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("sport_date")}</div><div style={{display:"flex",alignItems:"center",gap:8}}><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={{colorScheme:"dark",background:"none",border:"none",color:C.accent,fontSize:18,fontFamily:"monospace",fontWeight:700,outline:"none",flex:1,WebkitAppearance:"none",appearance:"none"}}/><span style={{fontSize:20,flexShrink:0}}>📅</span></div></Card>
        <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("time_label2")}</div><div style={{display:"flex",alignItems:"center",gap:8}}><input type="time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} style={{colorScheme:"dark",background:"none",border:"none",color:C.accent,fontSize:18,fontFamily:"monospace",fontWeight:700,outline:"none",flex:1,WebkitAppearance:"none",appearance:"none"}}/><span style={{fontSize:20,flexShrink:0}}>⏰</span></div></Card>
      </div>
      <div style={{marginBottom:16}}>
        <Kicker>{t("exercises_section")}</Kicker>
        <input value={exSearch} onChange={e=>setExSearch(e.target.value)}
          placeholder={t("search_exercise")}
          style={{width:"100%",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
            padding:"8px 12px",color:C.text,fontSize:13,outline:"none",
            boxSizing:"border-box",marginTop:6,marginBottom:8}}/>
        {editExIds.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {editExIds.map(id=>{
            const ex=(exercises||[]).find(e=>e.id===id);
            if(!ex)return null;
            return<div key={id} style={{display:"flex",alignItems:"center",gap:4,background:C.card,
              border:`0.5px solid ${C.border}`,borderRadius:8,padding:"4px 8px",fontSize:11}}>
              <span style={{color:C.text}}>{tField(ex,"name")}</span>
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
              <span>{ex.group_icon_url?<img src={ex.group_icon_url} alt="" style={{width:14,height:14,objectFit:"cover",borderRadius:3,verticalAlign:"middle",marginRight:3}}/>:ex.group_emoji+" "}{tField(ex,"name")}</span>
              <span style={{color:C.accent}}>+</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:10}}><Btn full onClick={()=>setEditing(false)} style={{flex:1}}>{t("cancel_btn2")}</Btn><Btn accent full onClick={save} disabled={saving} style={{flex:2}}>{saving?"...":t("save_profile")}</Btn></div>
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

  const filtered=(exercises||[]).filter(e=>(selGroups.size===0||selGroups.has(e.muscle_group_id))&&(!search||(e.name.toLowerCase().includes(search.toLowerCase())||(tField(e,"name")||"").toLowerCase().includes(search.toLowerCase()))));
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
      <Hero style={{textAlign:"center",marginTop:16}}>{t("scheduled_done")}</Hero>
      <div style={{color:C.muted,marginTop:8,fontFamily:"monospace"}}>{t("bot_1h")}</div>
      <Btn accent full onClick={onBack} style={{marginTop:32}}>{t("back")}</Btn>
    </div>
  </div>;

  if(step===0)return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={onBack}/>
      <Kicker>{t("plan_s1")}</Kicker><Hero>{t("muscles_title")}</Hero>
      <div style={{fontSize:13,color:C.muted,marginTop:8,marginBottom:16}}>{t("sel_group_hint")}</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        {muscleGroups?.map(g=>{
          const sel=selGroups.has(g.id);
          return(
            <Card key={g.id} accent={sel} onClick={()=>setSelGroups(p=>{const n=new Set(p);if(n.has(g.id))n.delete(g.id);else n.add(g.id);return n;})}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><span style={{fontSize:22,marginRight:12}}>{g.icon_url?<img src={g.icon_url} alt="" style={{width:26,height:26,objectFit:"cover",borderRadius:5,verticalAlign:"middle"}}/>:g.emoji}</span><span style={{fontSize:15,fontWeight:600,color:sel?C.accent:C.text}}>{tGroup(g)||g.name}</span></div>
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
      {viewEx.video_url?
        <video src={viewEx.video_url} style={{width:"100%",borderRadius:12,marginBottom:14,objectFit:"cover",maxHeight:220}} autoPlay loop muted playsInline onError={e=>e.target.style.display="none"}/>
        :viewEx.photo_url&&<img src={viewEx.photo_url} alt={viewEx.name} style={{width:"100%",borderRadius:12,marginBottom:14,objectFit:"cover",maxHeight:220}} onError={e=>e.target.style.display="none"}/>}
      <Kicker>{viewEx.group_emoji} {viewEx.group_name?.toUpperCase()}</Kicker>
      <Hero style={{fontSize:20}}>{viewEx.name}</Hero>
      <div style={{height:12}}/>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[{l:t("sets_label"),v:viewEx.sets_recommended},{l:t("reps_label2"),v:viewEx.reps_recommended},{l:t("difficulty_label"),v:getDiff(viewEx.difficulty)||viewEx.difficulty}].map((s,i)=>(
          <Card key={i} style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:4}}>{s.l}</div>
            <div style={{fontSize:14,fontWeight:700,color:C.accent}}>{s.v||"—"}</div>
          </Card>
        ))}
      </div>
      {viewEx.description&&<Card style={{marginBottom:10}}><Kicker>{t("description_label")}</Kicker><div style={{fontSize:14,color:C.text,lineHeight:1.6,marginTop:6}}>{viewEx.description}</div></Card>}
      {viewEx.equipment&&<Card style={{marginBottom:14}}><Kicker>{t("equipment_label")}</Kicker><div style={{fontSize:14,color:C.text,marginTop:4}}>{viewEx.equipment}</div></Card>}
      <div style={{display:"flex",gap:10}}>
        <Btn full onClick={()=>setViewEx(null)} style={{flex:1}}>{t("back")}</Btn>
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
    <BackBtn onBack={()=>setStep(0)}/><Kicker>{t("plan_s2")}</Kicker><Hero>{t("exercises_section")}</Hero>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("search_placeholder")} style={{width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:13,fontFamily:"monospace",outline:"none",boxSizing:"border-box",marginTop:12,marginBottom:12}}/>
    {selExs.length>0&&<div style={{marginBottom:12}}><Kicker>ВЫБРАНО ({selExs.length})</Kicker><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{selExs.map((e,i)=><Tag key={e.id} color={C.accent}>{i+1}. {e.name.split(" ").slice(0,2).join(" ")}</Tag>)}</div></div>}
    {filtered.slice(0,50).map(ex=>{const sel=selExs.find(e=>e.id===ex.id);return<ExCard key={ex.id} ex={ex} badge={getDiff(ex.difficulty)}
      onClick={()=>setViewEx(ex)}
      action={<button onClick={e=>{e.stopPropagation();toggle(ex);}} style={{flexShrink:0,width:32,height:32,borderRadius:8,background:sel?C.accent:C.card,border:`0.5px solid ${sel?C.accent:C.border}`,color:sel?C.bg:C.muted,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{sel?`${selExs.indexOf(sel)+1}`:"+"}</button>}/>;
    })}
    {selExs.length>0&&<div style={{position:"sticky",bottom:80,marginTop:12}}><Btn accent full onClick={()=>setStep(2)}>{t("next_datetime")}</Btn></div>}
  </div>;

  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={()=>setStep(1)}/><Kicker>{t("plan_s3")}</Kicker><Hero>{t("time_label2")}</Hero>
    <div style={{height:16}}/>
    <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
      <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("name_opt_section")}</div><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder={selExs.slice(0,2).map(e=>e.name.split(" ")[0]).join("+")||"Моя тренировка"} style={{background:"none",border:"none",color:C.text,fontSize:16,width:"100%",outline:"none"}}/></Card>
      <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("sport_date")}</div><div style={{display:"flex",alignItems:"center",gap:8}}><input id="plan-date-input" type="date" value={form.date} min={new Date().toISOString().split("T")[0]} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={{colorScheme:"dark",background:"none",border:"none",color:C.accent,fontSize:20,fontFamily:"monospace",fontWeight:700,outline:"none",flex:1,WebkitAppearance:"none",appearance:"none"}}/><span style={{fontSize:22,flexShrink:0}}>📅</span></div></Card>
      <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("time_label2")}</div><div style={{display:"flex",alignItems:"center",gap:8}}><input id="plan-time-input" type="time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} style={{colorScheme:"dark",background:"none",border:"none",color:C.accent,fontSize:20,fontFamily:"monospace",fontWeight:700,outline:"none",flex:1,WebkitAppearance:"none",appearance:"none"}}/><span style={{fontSize:22,flexShrink:0}}>⏰</span></div></Card>
    </div>
    <div style={{marginBottom:16}}><Kicker>УПРАЖНЕНИЯ ({selExs.length})</Kicker>{selExs.map((e,i)=><div key={e.id} style={{padding:"6px 0",borderBottom:`0.5px solid ${C.border}`,display:"flex",gap:10}}><Mono color={C.accent} size={13}>{i+1}</Mono><span style={{fontSize:13,color:C.text}}>{tField(e,"name")}</span></div>)}</div>
    <Btn accent full onClick={save} disabled={saving||!form.date}>{saving?"СОХРАНЯЕМ...":"📅 ЗАПЛАНИРОВАТЬ"}</Btn>
    <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",textAlign:"center",marginTop:8}}>{t("bot_1h_full")}</div>
  </div>;
}

// ─── STANDALONE TIMER (из меню) ──────────────────────────────────────────────
function StandaloneTimer({onBack}){
  return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={onBack}/>
      <Kicker>{t("tools_title")}</Kicker>
      <Hero>{t("timer_title")}</Hero>
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
        <Kicker>{t("weight_dynamics")}</Kicker>
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
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{t("one_session2")}</div>
      </div>
      <div style={{display:"flex",gap:16,padding:"8px 0"}}>
        <div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>{t("date_label")}</div><Mono size={13}>{String(d.date).slice(0,10).slice(5)}</Mono></div>
        <div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>{t("max_w")}</div><Mono size={13}>{d.max_weight}кг</Mono></div>
        <div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>{t("volume_section")}</div><Mono size={13}>{Math.round(d.volume)}</Mono></div>
        <div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>{t("sets_label")}</div><Mono size={13}>{d.sets}</Mono></div>
      </div>
      <div style={{fontSize:11,color:C.muted,marginTop:4}}>{t("need_2_workouts")}</div>
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
        max {Math.round(maxW)}{t("kcal_short")||""}кг · {data.length} {t("sessions_count")}
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
      <span>{t("volume_short")}</span>
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
  const [norms,setNorms]=useState(null);
  const [showNorms,setShowNorms]=useState(false);

  useEffect(()=>{
    if(!tgId)return;
    setMuscleData(null);
    fetch(`${API}/progress/muscle-groups/${tgId}?days=${days}`)
      .then(r=>r.json())
      .then(d=>setMuscleData(d))
      .catch(()=>setMuscleData({}));
  },[tgId,days]);

  useEffect(()=>{
    if(!tgId||norms)return;
    fetch(`${API}/strength-norms/${tgId}`)
      .then(r=>r.json()).then(setNorms).catch(()=>{});
  },[tgId]);

  if(!stats)return <div style={{padding:"16px 16px 100px"}}><Loader text="ПРОГРЕСС"/></div>;
  const weekly=stats.weekly_workouts||[];const peak=Math.max(...weekly,1);
  const blocks=" ▁▂▃▄▅▆▇█";const spark=weekly.map(v=>blocks[Math.min(8,Math.round(8*v/peak))]).join("");

  const groups=Object.entries(muscleData?.by_group||{});
  const selectedGroup=activeGroup&&muscleData?.by_group?.[activeGroup];

  return <div style={{padding:"16px 16px 100px"}}>
    <Kicker>{stats.period_days||30} ДНЕЙ</Kicker><Hero>{t("progress_title2")}</Hero>
    <div style={{height:16}}/>

    {/* Основные метрики */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
      {[
        {l:"ТРЕНИРОВОК",v:stats.total_workouts||0},
        {l:t("sets_label"),v:stats.total_sets||0},
        {l:t("tonnage_label2"),v:`${Math.round((stats.total_volume||0)/1000*10)/10} т`},
        {l:"СЕРИЯ",v:`${stats.streak_days||0} дн`}
      ].map((s,i)=><Card key={i}>
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:4}}>{tSport(s)||s.l}</div>
        <Mono>{s.v}</Mono>
      </Card>)}
    </div>

    {/* График по неделям */}
    {weekly.length>0&&<Card style={{marginBottom:16}}>
      <Kicker>{t("weekly_activity")}</Kicker>
      <div style={{fontFamily:"monospace",fontSize:22,color:C.accent,letterSpacing:2,margin:"8px 0"}}>{spark||t("no_sets_data")}</div>
      <div style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>{t("workouts_week")}</div>
    </Card>}

    {/* Прогресс по группам мышц */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <Kicker>{t("muscle_progress")}</Kicker>
      <select value={days} onChange={e=>setDays(Number(e.target.value))}
        style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:6,
          padding:"4px 8px",color:C.accent,fontSize:11,fontFamily:"monospace",outline:"none"}}>
        <option value={30}>{t("day_30")}</option>
        <option value={60}>{t("day_60")}</option>
        <option value={90}>{t("day_90")}</option>
        <option value={180}>{t("day_180")}</option>
      </select>
    </div>

    {!muscleData?<Loader text="ЗАГРУЗКА"/>:groups.length===0?
      <Card style={{marginBottom:16}}><div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"12px 0"}}>{t("no_data_period")}</div></Card>:
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

    {/* Нормы силовых показателей */}
    {norms?.norms&&<Card style={{marginBottom:16}}>
      <button onClick={()=>setShowNorms(!showNorms)}
        style={{width:"100%",background:"none",border:"none",display:"flex",
          alignItems:"center",justifyContent:"space-between",cursor:"pointer",padding:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>📏</span>
          <Kicker style={{margin:0}}>{t("strength_norms")}</Kicker>
        </div>
        <span style={{color:C.accent,fontSize:14}}>{showNorms?"∧":"∨"}</span>
      </button>
      {showNorms&&<div style={{marginTop:12,paddingTop:12,borderTop:`0.5px solid ${C.border}`}}>
        <div style={{fontSize:11,color:C.muted,marginBottom:10,fontFamily:"monospace"}}>
          {t("age_label")} {norms.age}{t("age_suffix")||"л"} · {norms.bodyweight}{t("kcal_short")||""}кг · {t("coef_label")||"коэф."} {norms.age_correction}
        </div>
        {norms.norms.map((n,i)=>{
          const levelColor={below_beginner:C.danger,beginner:C.warn,intermediate:C.accent,advanced:C.success,elite:"#00FFFF"}[n.your_level]||C.muted;
          const levelLabel={below_beginner:t("level_below"),beginner:t("level_beginner"),intermediate:t("level_intermediate"),advanced:t("level_advanced"),elite:t("level_elite")}[n.your_level]||"—";
          const pct=n.your_max?Math.min(100,Math.round((n.your_max/n.levels.elite)*100)):0;
          return<div key={i} style={{marginBottom:12,paddingBottom:12,borderBottom:i<norms.norms.length-1?`0.5px solid ${C.border}`:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:13,color:C.text,fontWeight:500}}>{n.exercise}</span>
              <div style={{textAlign:"right"}}>
                {n.your_max
                  ?<><Mono size={13}>{n.your_max}{n.unit||"кг"}</Mono><span style={{fontSize:11,color:levelColor,marginLeft:6}}>{levelLabel}</span></>
                  :<span style={{fontSize:11,color:C.muted}}>{t("no_data_short")}</span>
                }
              </div>
            </div>
            <ProgressBar pct={pct} color={levelColor}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:10,color:C.muted,fontFamily:"monospace"}}>
              <span>{t("norm_beg")}: {n.levels.beginner}{n.unit||"кг"}</span>
              <span>{t("norm_mid")}: {n.levels.intermediate}{n.unit||"кг"}</span>
              <span>{t("norm_adv")}: {n.levels.advanced}{n.unit||"кг"}</span>
              <span>{t("norm_elite")}: {n.levels.elite}{n.unit||"кг"}</span>
            </div>
          </div>;
        })}
      </div>}
    </Card>}

    {/* Плато детектор */}
    <PlateauBlock tgId={tgId}/>
  </div>;
}

// ─── CATALOG ──────────────────────────────────────────────────────────────────
function ExerciseCatalogCard({ex,onClick}){
  const containerRef=useRef(null);
  const [inView,setInView]=useState(false);
  const [imgLoaded,setImgLoaded]=useState(false);

  useEffect(()=>{
    if(!ex.video_url||!containerRef.current)return;
    const obs=new IntersectionObserver((entries)=>{
      if(entries[0].isIntersecting){setInView(true);obs.disconnect();}
    },{rootMargin:"150px"}); // начинаем грузить видео чуть раньше, до появления в кадре
    obs.observe(containerRef.current);
    return ()=>obs.disconnect();
  },[ex.video_url]);

  return (
    <Card onClick={onClick} style={{padding:0,overflow:"hidden",cursor:"pointer",marginBottom:0}}>
      <div ref={containerRef} style={{position:"relative",width:"100%",aspectRatio:"1/1",background:C.bg,overflow:"hidden"}}>
        {ex.video_url&&inView?
          <video src={ex.video_url} poster={ex.photo_url} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
            autoPlay loop muted playsInline preload="metadata" onError={e=>e.target.style.display="none"}/>
          :ex.photo_url?
          <img src={ex.photo_url} alt="" loading="lazy"
            style={{width:"100%",height:"100%",objectFit:"cover",display:"block",opacity:imgLoaded?1:0,transition:"opacity 0.25s ease"}}
            onLoad={()=>setImgLoaded(true)} onError={e=>e.target.style.display="none"}/>
          :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>{ex.group_emoji||"💪"}</div>}
      </div>
      <div style={{padding:"9px 10px 11px"}}>
        <div style={{fontWeight:600,fontSize:12.5,color:C.text,lineHeight:1.3,marginBottom:5,minHeight:32}}>{tField(ex,"name")}</div>
        <Tag color={DIFF_COLOR[ex.difficulty]||C.muted}>{getDiff(ex.difficulty)}</Tag>
      </div>
    </Card>
  );
}

function CatalogScreen({exercises,muscleGroups}){
  const [activeGroup,setActiveGroup]=useState(null);
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const filtered=(exercises||[]).filter(e=>(!activeGroup||e.muscle_group_id===activeGroup)&&(!search||(e.name.toLowerCase().includes(search.toLowerCase())||(tField(e,"name")||"").toLowerCase().includes(search.toLowerCase()))));

  // Предзагрузка фото видимой выборки — прогреваем кэш браузера ДО того как карточки
  // реально отрендерятся, чтобы изображения не "выскакивали" по одному при скролле.
  // Кэш теперь долгоживущий (immutable) — при повторном заходе фото вообще не перекачиваются.
  useEffect(()=>{
    filtered.slice(0,40).forEach(ex=>{
      if(ex.photo_url){const img=new Image();img.src=ex.photo_url;}
    });
  },[activeGroup,search,exercises]);

  if(selected)return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={()=>setSelected(null)}/>
    {selected.video_url?
      <video src={selected.video_url} poster={selected.photo_url} style={{width:"100%",borderRadius:12,marginBottom:14,objectFit:"cover",maxHeight:220}} autoPlay loop muted playsInline preload="auto" onError={e=>e.target.style.display="none"}/>
      :selected.photo_url&&<img src={selected.photo_url} alt={tField(selected,"name")} style={{width:"100%",borderRadius:12,marginBottom:14,objectFit:"cover",maxHeight:220}} onError={e=>e.target.style.display="none"}/>}
    <Kicker>{selected.group_icon_url?<img src={selected.group_icon_url} alt="" style={{width:16,height:16,objectFit:"cover",borderRadius:3,verticalAlign:"middle",marginRight:4}}/>:selected.group_emoji+" "}{tGroup(selected)?.toUpperCase()}</Kicker><Hero>{tField(selected,"name")}</Hero>
    <div style={{height:12}}/>
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      {[{l:t("sets_label"),v:selected.sets_recommended},{l:t("reps_label2"),v:selected.reps_recommended},{l:t("difficulty_label"),v:getDiff(selected.difficulty)||selected.difficulty}].map((s,i)=><Card key={i} style={{flex:1,textAlign:"center"}}><div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:4}}>{s.l}</div><div style={{fontSize:14,fontWeight:700,color:C.accent}}>{s.v||"—"}</div></Card>)}
    </div>
    {selected.description&&<Card style={{marginBottom:10}}><Kicker>{t("description_label")}</Kicker><div style={{fontSize:14,color:C.text,lineHeight:1.6,marginTop:6}}>{tField(selected,"description")}</div></Card>}
    {selected.technique&&<Card style={{marginBottom:10}}>
      <Kicker>{t("technique_label")}</Kicker>
      <div style={{fontSize:14,color:C.text,lineHeight:1.8,marginTop:6,whiteSpace:"pre-wrap"}}>{tField(selected,"technique")}</div>
    </Card>}
    {selected.equipment&&<Card><Kicker>{t("equipment_label")}</Kicker><div style={{fontSize:14,color:C.text,marginTop:4}}>{tEquip(selected.equipment)}</div></Card>}
  </div>;

  return <div style={{padding:"16px 16px 100px"}}>
    <Kicker>{t("knowledge_base")}</Kicker><Hero>{t("exercises_section")}</Hero>
    <div style={{height:12}}/>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("search_placeholder")} style={{width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:13,fontFamily:"monospace",letterSpacing:1,boxSizing:"border-box",marginBottom:12,outline:"none"}}/>
    <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:12}}>
      <button onClick={()=>setActiveGroup(null)} style={{flexShrink:0,padding:"6px 12px",borderRadius:20,background:!activeGroup?C.accent:C.card,color:!activeGroup?C.bg:C.muted,border:`0.5px solid ${!activeGroup?C.accent:C.border}`,fontSize:11,fontFamily:"monospace",cursor:"pointer",fontWeight:700}}>ВСЕ</button>
      {muscleGroups?.map(g=><button key={g.id} onClick={()=>setActiveGroup(g.id===activeGroup?null:g.id)} style={{flexShrink:0,padding:"6px 12px",borderRadius:20,background:activeGroup===g.id?C.accent:C.card,color:activeGroup===g.id?C.bg:C.muted,border:`0.5px solid ${activeGroup===g.id?C.accent:C.border}`,fontSize:11,fontFamily:"monospace",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5}}>{g.icon_url?<img src={g.icon_url} alt="" style={{width:16,height:16,objectFit:"cover",borderRadius:3}}/>:g.emoji} {(tGroup(g)||g.name).toUpperCase()}</button>)}
    </div>
    <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{filtered.length}  {t("exercises_label")}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      {filtered.slice(0,60).map(ex=><ExerciseCatalogCard key={ex.id} ex={ex} onClick={()=>setSelected(ex)}/>)}
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
          setError(t("no_audio"));
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
      setError(e.name==="NotAllowedError"?t("no_mic"):e.message||"Ошибка");
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
      if(!d.text)throw new Error(t("speech_not_recognized"));
      onTranscribed(d.text);
    }catch(e){
      console.error("[Voice] transcribe error:",e);
      setError(e.message||t("transcription_error"));
    }finally{
      setLoading(false);
    }
  }

  const fmt=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  return(
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      {error&&<div style={{fontSize:11,color:C.danger,flex:1}}>{error}</div>}
      {loading&&<div style={{fontSize:11,color:C.muted,fontFamily:"monospace",flex:1}}>{t("recognizing")}</div>}
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
  const [chatHistory,setChatHistory]=useState([]); // [{role,content,time}]
  const [sessionId]=useState(()=>`session_${tgId}_${Date.now()}`);
  const requestsLeft=5-(user?.ai_requests_today||0);
  const suggs=["Составь план тренировки на неделю под набор массы","Что есть до и после тренировки","Программа для похудения на месяц","Тренировка на плечи и руки"];

  async function ask(question){
    if(!question.trim()||loading)return;
    const userMsg={role:"user",content:question,time:new Date().toLocaleTimeString("ru",{hour:"2-digit",minute:"2-digit"})};
    setChatHistory(prev=>[...prev,userMsg]);
    setLoading(true);setAnswer(null);setWorkoutPlan(null);setSaved(false);setQ("");
    try{
      const res=await fetch(`${API}/ai/ask`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({question,tg_id:tgId,session_id:sessionId})});
      if(res.status===429){setAnswer(t("limit_exceeded"));return;}
      if(!res.ok){
        const err=await res.text().catch(()=>"");
        setAnswer(`Ошибка сервера (${res.status})${err?" — "+err.slice(0,100):""}. Попробуй позже.`);
        return;
      }
      const d=await res.json();
      const aiAnswer=d.answer||t("no_answer");
      setAnswer(aiAnswer);
      if(d.workout_plan)setWorkoutPlan(d.workout_plan);
      const aiMsg={role:"assistant",content:aiAnswer,time:new Date().toLocaleTimeString("ru",{hour:"2-digit",minute:"2-digit"})};
      setChatHistory(prev=>[...prev,aiMsg]);
    }catch(e){
      const errMsg="Ошибка соединения — "+e.message;
      setAnswer(errMsg);
      setChatHistory(prev=>[...prev,{role:"assistant",content:errMsg,time:""}]);
    }
    finally{setLoading(false);}
  }

  function clearHistory(){
    setChatHistory([]);
    setAnswer(null);setWorkoutPlan(null);setSaved(false);
    if(tgId)fetch(`${API}/ai/history/${tgId}?session_id=${sessionId}`,{method:"DELETE"}).catch(()=>{});
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
          exercise_names:workoutPlan.exercises||[],
          ai_plan_text:answer||null})});
      if(res.ok){setSaved(true);setWorkoutPlan(null);}
      else setSaving(false);
    }catch{setSaving(false);}
    finally{setSaving(false);}
  }

  return <div style={{padding:"16px 16px 160px"}}>
    <Kicker>{t("ai_trainer_title")}</Kicker><Hero>{t("ai_trainer_online")}</Hero>
    <div style={{color:C.muted,fontSize:13,marginTop:6,marginBottom:16,fontFamily:"monospace"}}>{t("requests_left")} <Mono size={13}>{requestsLeft}</Mono></div>
    {/* История чата */}
    {chatHistory.length>0&&<div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <Kicker>{t("ai_chat_title")}</Kicker>
        <button onClick={clearHistory} style={{background:"none",border:`0.5px solid ${C.border}`,borderRadius:6,padding:"3px 10px",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>
          🗑 ОЧИСТИТЬ
        </button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {chatHistory.map((msg,i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:msg.role==="user"?"flex-end":"flex-start"}}>
            <div style={{
              maxWidth:"85%",padding:"10px 14px",borderRadius:12,
              background:msg.role==="user"?"rgba(200,255,0,0.12)":C.card,
              border:`0.5px solid ${msg.role==="user"?C.accent:C.border}`,
            }}>
              {msg.role==="assistant"&&<div style={{fontSize:10,color:C.accent,fontFamily:"monospace",marginBottom:4}}>{t("ai_coach_label")}</div>}
              <div style={{fontSize:13,color:C.text,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{msg.content}</div>
              {msg.time&&<div style={{fontSize:10,color:C.muted,marginTop:4,textAlign:"right"}}>{msg.time}</div>}
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",alignItems:"flex-start"}}>
          <div style={{padding:"10px 14px",borderRadius:12,background:C.card,border:`0.5px solid ${C.border}`}}>
            <div style={{color:C.accent,fontFamily:"monospace",fontSize:12,letterSpacing:2}}>{t("ai_thinking2")}</div>
          </div>
        </div>}
      </div>
    </div>}

    {/* Быстрые вопросы — только если нет истории */}
    {chatHistory.length===0&&<div style={{marginBottom:8}}>
      <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("quick_questions")}</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {suggs.map((s,i)=><button key={i} onClick={()=>{setQ(s);ask(s);}}
          style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:13,cursor:"pointer",textAlign:"left"}}>{s} →</button>)}
      </div>
    </div>}

    {/* Фиксированный блок ввода внизу */}
    <div style={{position:"fixed",bottom:"calc(60px + env(safe-area-inset-bottom))",left:0,right:0,background:C.surface,borderTop:`0.5px solid ${C.border}`,padding:"10px 12px",zIndex:50}}>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
        <VoiceRecorder tgId={tgId} disabled={loading} onTranscribed={text=>setQ(prev=>prev?prev+" "+text:text)}/>
        <div style={{flex:1,background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,display:"flex",alignItems:"center"}}>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask(q)}
            placeholder="СПРОСИ ЧТО УГОДНО..." style={{flex:1,background:"none",border:"none",padding:"10px 14px",color:C.text,fontSize:13,fontFamily:"monospace",outline:"none"}}/>
          <button onClick={()=>ask(q)} disabled={loading||!q.trim()}
            style={{background:C.accent,border:"none",borderRadius:"0 8px 8px 0",padding:"10px 16px",color:C.bg,fontWeight:700,fontSize:14,cursor:"pointer",opacity:loading||!q.trim()?0.5:1}}>→</button>
        </div>
      </div>
      <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",textAlign:"center"}}>{t("voice_hint")}</div>
    </div>

        {/* Блок сохранения тренировки */}
    {workoutPlan&&!saved&&(
      <div style={{marginBottom:12,padding:"12px 14px",background:"#C8FF0015",border:`0.5px solid ${C.accent}`,borderRadius:10}}>
        <div style={{fontSize:12,color:C.accent,fontFamily:"monospace",marginBottom:6}}>{t("ai_proposes")}</div>
        <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:4}}>{workoutPlan.title}</div>
        {workoutPlan.exercises?.length>0&&(
          <div style={{fontSize:12,color:C.muted,marginBottom:6}}>{workoutPlan.exercises.slice(0,5).join(", ")}{workoutPlan.exercises.length>5?` +${workoutPlan.exercises.length-5} ещё`:""}</div>
        )}
        {workoutPlan.exercises?.length>0&&exercises?.length>0&&(()=>{
          const matched=workoutPlan.exercises.filter(name=>{
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
        <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",textAlign:"center",marginTop:6}}>{t("ai_date_hint")}</div>
      </div>
    )}
    {saved&&<div style={{marginBottom:12,background:"#00CC6622",border:`0.5px solid ${C.success}`,borderRadius:10,padding:"10px 14px",fontSize:12,color:C.success,fontFamily:"monospace"}}>{t("workout_saved_tab")}</div>}
    {saved&&<button onClick={()=>onNav&&onNav("my_workouts")} style={{width:"100%",marginBottom:12,background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px 16px",color:C.text,fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>
      ОТКРЫТЬ РАСПИСАНИЕ →
    </button>}
    {showDatePicker&&(
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{background:C.surface,borderRadius:16,padding:20,width:"100%",maxWidth:360}}>
          <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:16,fontFamily:"monospace"}}>{t("when_workout2")}</div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:6}}>{t("sport_date")}</div>
            <input type="date" value={planDate} min={new Date().toISOString().split("T")[0]}
              onChange={e=>setPlanDate(e.target.value)}
              style={{colorScheme:"dark",width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.accent,fontSize:16,fontFamily:"monospace",outline:"none"}}/>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:6}}>{t("time_label2")}</div>
            <input type="time" value={planTime}
              onChange={e=>setPlanTime(e.target.value)}
              style={{colorScheme:"dark",width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.accent,fontSize:16,fontFamily:"monospace",outline:"none"}}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn full onClick={()=>setShowDatePicker(false)} style={{flex:1}}>{t("cancel_btn2")}</Btn>
            <Btn accent full onClick={confirmSaveWorkoutPlan} style={{flex:2}}>{t("save_confirm")}</Btn>
          </div>
        </div>
      </div>
    )}
  </div>;
}

// ─── FOOD VISION ─────────────────────────────────────────────────────────────



const CROP_SIZE=320; // размер квадратной рамки кадрирования на экране (px)
const CROP_OUTPUT=800; // размер итогового изображения, отправляемого на анализ (px)

function FoodVisionScreen({tgId,onBack,mealType}){
  const [rawFile,setRawFile]=useState(null); // исходный File до кадрирования
  const [photo,setPhoto]=useState(null); // base64 после кадрирования — то, что уходит на анализ
  const [preview,setPreview]=useState(null); // base64 после кадрирования — превью
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [saved,setSaved]=useState(false);
  const [error,setError]=useState(null);
  const [editing,setEditing]=useState(false);
  const [editText,setEditText]=useState("");
  const [recalculating,setRecalculating]=useState(false);
  const inputRef=useRef(null);

  // ── Кадрирование ──────────────────────────────────────────────────────────
  const [cropping,setCropping]=useState(false);
  const [cropImg,setCropImg]=useState(null); // HTMLImageElement
  const [zoom,setZoom]=useState(1); // множитель поверх базового scale (cover)
  const [offset,setOffset]=useState({x:0,y:0}); // смещение центра изображения относительно рамки
  const canvasRef=useRef(null);
  const dragRef=useRef(null); // {startX,startY,startOffX,startOffY}

  function baseScale(img){
    // Минимальный scale, при котором изображение полностью покрывает квадратную рамку
    return Math.max(CROP_SIZE/img.naturalWidth, CROP_SIZE/img.naturalHeight);
  }

  function handleFile(file){
    if(!file)return;
    setResult(null);setSaved(false);setError(null);
    setRawFile(file);
    const img=new Image();
    img.onload=()=>{
      setCropImg(img);
      setZoom(1);
      setOffset({x:0,y:0});
      setCropping(true);
    };
    img.src=URL.createObjectURL(file);
  }

  // Перерисовываем canvas кадрирования при любом изменении зума/смещения/картинки
  useEffect(()=>{
    if(!cropping||!cropImg||!canvasRef.current)return;
    const canvas=canvasRef.current;
    canvas.width=CROP_SIZE;canvas.height=CROP_SIZE;
    const ctx=canvas.getContext("2d");
    ctx.clearRect(0,0,CROP_SIZE,CROP_SIZE);
    const scale=baseScale(cropImg)*zoom;
    const w=cropImg.naturalWidth*scale, h=cropImg.naturalHeight*scale;
    const cx=CROP_SIZE/2+offset.x, cy=CROP_SIZE/2+offset.y;
    ctx.drawImage(cropImg, cx-w/2, cy-h/2, w, h);
  },[cropping,cropImg,zoom,offset]);

  function clampOffset(next,z){
    if(!cropImg)return next;
    const scale=baseScale(cropImg)*z;
    const w=cropImg.naturalWidth*scale, h=cropImg.naturalHeight*scale;
    const maxX=Math.max(0,(w-CROP_SIZE)/2), maxY=Math.max(0,(h-CROP_SIZE)/2);
    return {x:Math.max(-maxX,Math.min(maxX,next.x)), y:Math.max(-maxY,Math.min(maxY,next.y))};
  }

  function onDragStart(e){
    const p=e.touches?e.touches[0]:e;
    dragRef.current={startX:p.clientX,startY:p.clientY,startOffX:offset.x,startOffY:offset.y};
  }
  function onDragMove(e){
    if(!dragRef.current)return;
    const p=e.touches?e.touches[0]:e;
    const dx=p.clientX-dragRef.current.startX, dy=p.clientY-dragRef.current.startY;
    setOffset(clampOffset({x:dragRef.current.startOffX+dx,y:dragRef.current.startOffY+dy},zoom));
  }
  function onDragEnd(){dragRef.current=null;}

  function confirmCrop(){
    if(!cropImg)return;
    const out=document.createElement("canvas");
    out.width=CROP_OUTPUT;out.height=CROP_OUTPUT;
    const ctx=out.getContext("2d");
    const scale=baseScale(cropImg)*zoom*(CROP_OUTPUT/CROP_SIZE);
    const w=cropImg.naturalWidth*scale, h=cropImg.naturalHeight*scale;
    const cx=CROP_OUTPUT/2+offset.x*(CROP_OUTPUT/CROP_SIZE), cy=CROP_OUTPUT/2+offset.y*(CROP_OUTPUT/CROP_SIZE);
    ctx.drawImage(cropImg, cx-w/2, cy-h/2, w, h);
    const dataUrl=out.toDataURL("image/jpeg",0.88);
    setPreview(dataUrl);
    setPhoto(dataUrl.split(",")[1]);
    setCropping(false);
  }

  function recropCurrentPhoto(){
    // Вернуться к кадрированию того же файла (кнопка "Другое фото" открывает выбор нового файла отдельно)
    if(!rawFile)return;
    const img=new Image();
    img.onload=()=>{setCropImg(img);setZoom(1);setOffset({x:0,y:0});setCropping(true);};
    img.src=URL.createObjectURL(rawFile);
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
    if(!result)return;
    setLoading(true);setError(null);
    try{
      // Сохраняем то, что реально показано в result (включая правки после пересчёта),
      // а не заново анализируем фото — иначе правка потеряется при сохранении.
      const res=await fetch(`${API}/nutrition/${tgId}`,{method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({meal_name:result.dish_name||"Блюдо",kcal:Number(result.calories)||0,
          protein:Number(result.protein_g)||0,fat:Number(result.fat_g)||0,carb:Number(result.carbs_g)||0,
          meal_type:mealType||null})});
      if(!res.ok){
        let detail="";
        try{const j=await res.json();detail=j.detail||"";}catch{}
        throw new Error(`HTTP ${res.status}${detail?": "+detail:""}`);
      }
      setSaved(true);
    }catch(e){
      setError(`Не удалось сохранить: ${e.message||"неизвестная ошибка"}`);
    }finally{setLoading(false);}
  }

  async function recalcNutrition(){
    if(!editText.trim())return;
    setRecalculating(true);setError(null);
    try{
      const res=await fetch(`${API}/food/recalc`,{method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({description:editText,weight_g:result?.weight_g||300})});
      if(!res.ok)throw new Error(res.status);
      const newResult=await res.json();
      setResult(newResult);
      setEditing(false);setEditText("");
    }catch{setError("Не удалось пересчитать. Попробуй описать иначе.");}
    finally{setRecalculating(false);}
  }

  const confColor={"high":C.success,"medium":C.warn,"low":C.danger};
  const confLabel={"high":"✅ Высокая","medium":"⚠️ Средняя","low":"❓ Низкая"};

  return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={onBack}/>
      <Kicker>{t("ai_nutrition_title")}</Kicker>
      <Hero>{t("photo_kbju_title2")}</Hero>
      <div style={{color:C.muted,fontSize:13,marginTop:4,marginBottom:20}}>{t("photo_kbju_hint")}</div>
      <input ref={inputRef} type="file" accept="image/*"
        onChange={e=>{handleFile(e.target.files[0]);e.target.value="";}} style={{display:"none"}}/>
      {cropping?(
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:8,textAlign:"center"}}>
            Перемещай и увеличивай, чтобы блюдо поместилось целиком
          </div>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
            <canvas ref={canvasRef} width={CROP_SIZE} height={CROP_SIZE}
              style={{borderRadius:12,border:`0.5px solid ${C.border}`,touchAction:"none",cursor:"grab"}}
              onMouseDown={onDragStart} onMouseMove={onDragMove} onMouseUp={onDragEnd} onMouseLeave={onDragEnd}
              onTouchStart={onDragStart} onTouchMove={onDragMove} onTouchEnd={onDragEnd}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,padding:"0 4px"}}>
            <span style={{fontSize:16}}>🔍</span>
            <input type="range" min="1" max="3" step="0.05" value={zoom}
              onChange={e=>{const z=parseFloat(e.target.value);setZoom(z);setOffset(o=>clampOffset(o,z));}}
              style={{flex:1,accentColor:C.accent}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn full onClick={()=>{setCropping(false);if(!preview){setRawFile(null);}}} style={{flex:1}}>Отмена</Btn>
            <Btn accent full onClick={confirmCrop} style={{flex:2}}>✅ ГОТОВО</Btn>
          </div>
        </div>
      ):!preview?(
        <div onClick={()=>inputRef.current?.click()}
          style={{border:`2px dashed ${C.border}`,borderRadius:16,padding:"48px 20px",
            textAlign:"center",cursor:"pointer",marginBottom:16}}>
          <div style={{fontSize:52,marginBottom:10}}>📷</div>
          <Btn accent full style={{pointerEvents:"none",fontSize:15}}>{t("add_photo_btn")}</Btn>
        </div>
      ):(
        <div style={{marginBottom:16}}>
          <img src={preview} alt="food" style={{width:"100%",borderRadius:12,maxHeight:280,objectFit:"contain",background:C.bg,marginBottom:10}}/>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <Btn full onClick={()=>inputRef.current?.click()} style={{flex:1}}>{t("other_photo2")}</Btn>
            {!result&&!loading&&<Btn accent full onClick={analyze} style={{flex:2}}>{t("analyze_btn2")}</Btn>}
          </div>
          {!result&&!loading&&<Btn full onClick={recropCurrentPhoto}>🔄 Перекадрировать</Btn>}
        </div>
      )}
      {loading&&<Card><div style={{textAlign:"center",padding:"16px 0",color:C.accent,fontFamily:"monospace",fontSize:12,letterSpacing:2}}>{t("analyzing_photo2")}</div></Card>}
      {error&&(
        <Card>
          <div style={{color:C.danger,fontSize:13,textAlign:"center",padding:"8px 0",marginBottom:result?8:0}}>{error}</div>
          {result&&!saved&&(
            <Btn accent full onClick={saveToLog} disabled={loading}>
              {loading?"ПОВТОРЯЕМ...":"🔄 ПОВТОРИТЬ СОХРАНЕНИЕ"}
            </Btn>
          )}
        </Card>
      )}
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
                <div style={{fontSize:11,color:C.muted}}>{t("kcal_short")}</div>
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
          {editing&&(
            <Card style={{marginBottom:12}}>
              <div style={{fontSize:12,color:C.muted,marginBottom:8}}>
                Напиши правильное название или состав блюда. КБЖУ пересчитается автоматически.
              </div>
              <input value={editText} onChange={e=>setEditText(e.target.value)}
                placeholder="Например: Рисовая каша с молоком и мёдом, 300г"
                style={{width:"100%",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,
                  padding:"10px 12px",color:C.text,fontSize:13,outline:"none",marginBottom:10}}/>
              <div style={{display:"flex",gap:8}}>
                <Btn full onClick={()=>{setEditing(false);setEditText("");}} style={{flex:1}}>Отмена</Btn>
                <Btn accent full onClick={recalcNutrition} disabled={recalculating||!editText.trim()} style={{flex:2}}>
                  {recalculating?"ПЕРЕСЧИТЫВАЕМ...":"🔄 ПЕРЕСЧИТАТЬ"}
                </Btn>
              </div>
            </Card>
          )}
          {saved?(
            <div style={{background:"#00CC6622",border:`0.5px solid ${C.success}`,borderRadius:10,
              padding:"12px",fontSize:13,color:C.success,fontFamily:"monospace",textAlign:"center"}}>
              ✓ СОХРАНЕНО В ДНЕВНИК ПИТАНИЯ
            </div>
          ):!editing&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{display:"flex",gap:8}}>
                <Btn full onClick={()=>{setResult(null);setPreview(null);setPhoto(null);}} style={{flex:1}}>{t("new_photo")}</Btn>
                <Btn accent full onClick={saveToLog} disabled={loading} style={{flex:2}}>
                  {loading?"СОХРАНЯЕМ...":"💾 В ДНЕВНИК"}
                </Btn>
              </div>
              <Btn full onClick={()=>{setEditing(true);setEditText("");}}>✏️ ИСПРАВИТЬ</Btn>
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
  const [editingLog,setEditingLog]=useState(null);
  const [editLogText,setEditLogText]=useState("");
  const [editLogWeight,setEditLogWeight]=useState(300);
  const [editLogBusy,setEditLogBusy]=useState(false);
  const isToday=viewDate===new Date().toISOString().split("T")[0];

  // Норма воды: вес(кг) * 30мл / 250мл = стаканов (мин 6, макс 12)
  const waterGoal=data?.water_norm_glasses||8;

  function load(){
    if(!tgId)return;
    const url=isToday?`${API}/nutrition/${tgId}`:`${API}/nutrition/${tgId}/history?date=${viewDate}`;
    fetch(url).then(r=>r.json()).then(d=>{setData(d);const w=(d.today_logs||d.logs||[]).find(l=>l.meal_type==="water");setGlasses(w?.kcal||0);}).catch(()=>setError(t("error_load")));
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
      else{setAiAnswer(d.answer||t("no_answer"));}
    }catch{setAiAnswer(t("error_request"));}
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

  async function recalcAndUpdateLog(logId){
    if(!editLogText.trim())return;
    setEditLogBusy(true);
    try{
      const res=await fetch(`${API}/food/recalc`,{method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({description:editLogText,weight_g:editLogWeight||300})});
      if(!res.ok)throw new Error(`recalc HTTP ${res.status}`);
      const r=await res.json();
      const putRes=await fetch(`${API}/nutrition/${tgId}/${logId}`,{method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({meal_name:r.dish_name||"Блюдо",kcal:Number(r.calories)||0,
          protein:Number(r.protein_g)||0,fat:Number(r.fat_g)||0,carb:Number(r.carbs_g)||0})});
      if(!putRes.ok)throw new Error(`update HTTP ${putRes.status}`);
      setEditingLog(null);setEditLogText("");setData(null);load();
    }catch(e){alert(`Не удалось сохранить: ${e.message||"ошибка"}`);}
    finally{setEditLogBusy(false);}
  }

  async function setWater(g){setGlasses(g);try{await fetch(`${API}/nutrition/${tgId}/water`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({glasses:g})});}catch{}}

  if(error)return<div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Card><div style={{color:C.danger,fontSize:13}}>{error}</div></Card></div>;
  if(!data)return<div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader text="ПИТАНИЕ"/></div>;

  const pct=Math.min(100,Math.round(((totals.kcal||0)/Math.max(data.target_kcal||2000,1))*100));

  return<div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>{t("menu_nutrition")}</Kicker><Hero>{t("nutrition_title")}</Hero>

    <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,marginBottom:16}}>
      <button onClick={()=>{const d=new Date(viewDate);d.setDate(d.getDate()-1);setViewDate(d.toISOString().split("T")[0]);}} style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"6px 14px",color:C.text,cursor:"pointer",fontSize:16}}>‹</button>
      <div style={{flex:1,textAlign:"center",fontFamily:"monospace",fontSize:12,color:isToday?C.accent:C.muted}}>{isToday?"СЕГОДНЯ":new Date(viewDate+"T12:00:00").toLocaleDateString("ru",{day:"numeric",month:"short"})}</div>
      {!isToday&&<button onClick={()=>setViewDate(new Date().toISOString().split("T")[0])} style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"6px 14px",color:C.text,cursor:"pointer",fontSize:16}}>›</button>}
    </div>

    <Card accent style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8}}>
        <Mono>{totals.kcal||0} <span style={{fontSize:13,color:C.muted,fontWeight:400}}>{t("kcal_short")}</span></Mono>
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
      {glasses===0&&isToday&&<div style={{fontSize:11,color:"rgba(0,180,255,0.5)",fontFamily:"monospace"}}>{t("water_tap_hint")}</div>}
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
          <Fragment key={l.id}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:`0.5px solid ${C.border}`}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,color:C.text}}>{l.meal_name}</div>
              <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginTop:2}}>Б{l.protein}г · Ж{l.fat}г · У{l.carb}г</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <Mono size={13}>{l.kcal} <span style={{fontSize:10,color:C.muted,fontWeight:400}}>{t("kcal_short")}</span></Mono>
              {l.id&&isToday&&<button onClick={()=>{setEditingLog(editingLog===l.id?null:l.id);setEditLogText("");setEditLogWeight(300);}} style={{background:"none",border:`0.5px solid ${C.border}`,borderRadius:6,padding:"2px 7px",color:C.muted,fontSize:11,cursor:"pointer"}}>✏️</button>}
              {l.id&&isToday&&<button onClick={()=>deleteLog(l.id)} style={{background:"none",border:`0.5px solid ${C.danger}`,borderRadius:6,padding:"2px 7px",color:C.danger,fontSize:11,cursor:"pointer"}}>✕</button>}
            </div>
          </div>
          {editingLog===l.id&&(
            <div style={{padding:"8px 0",borderTop:`0.5px solid ${C.border}`}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Исправь название/состав — КБЖУ пересчитается автоматически</div>
              <input value={editLogText} onChange={e=>setEditLogText(e.target.value)}
                placeholder="Например: Рисовая каша с молоком, 300г"
                style={{width:"100%",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",marginBottom:8}}/>
              <div style={{display:"flex",gap:8}}>
                <Btn full onClick={()=>{setEditingLog(null);setEditLogText("");}} style={{flex:1}}>Отмена</Btn>
                <Btn accent full onClick={()=>recalcAndUpdateLog(l.id)} disabled={editLogBusy||!editLogText.trim()} style={{flex:2}}>
                  {editLogBusy?"ПЕРЕСЧИТЫВАЕМ...":"🔄 ПЕРЕСЧИТАТЬ И СОХРАНИТЬ"}
                </Btn>
              </div>
            </div>
          )}
          </Fragment>
        ))}
        {adding===meal.type&&isToday&&<div style={{marginTop:12,paddingTop:12,borderTop:`0.5px solid ${C.border}`}}>
          <input value={form.meal_name} onChange={e=>setForm(p=>({...p,meal_name:e.target.value}))} placeholder={t("dish_name")} style={{width:"100%",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",marginBottom:8}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:10}}>
            {[{k:"kcal",p:"Ккал"},{k:"protein",p:"Белки"},{k:"fat",p:"Жиры"},{k:"carb",p:"Углев"}].map(f=>(
              <input key={f.k} type="number" value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.p} style={{background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px 6px",color:C.text,fontSize:12,outline:"none",textAlign:"center"}}/>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn full onClick={()=>setAdding(null)} style={{flex:1}}>{t("cancel_btn2")}</Btn>
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
          <div style={{fontSize:11,color:C.muted}}>{t("or_write")}</div>
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
      <Kicker>{t("add_product_btn")}</Kicker>
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
        <Kicker>{t("field_weight_g")||"ВЕС (г)"}</Kicker>
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
        <Kicker>{t("meal_section")}</Kicker>
        <Sel value={meal} onChange={setMeal} options={MEAL_OPTS}/>
      </div>

      {saved
        ?<div style={{textAlign:"center",color:C.accent,fontFamily:"monospace",fontSize:14,padding:20}}>{t("added_done")}</div>
        :<Btn accent full onClick={logProduct} disabled={saving||!weight||parseFloat(weight)<=0}>
          {saving?"СОХРАНЯЕМ...":"ДОБАВИТЬ В ДНЕВНИК"}
        </Btn>
      }
    </div>;
  }

  return<div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/>
    <Kicker>{t("menu_nutrition")}</Kicker>
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
            <div style={{fontSize:10,color:C.muted}}>{t("kcal_100g")}</div>
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
      if(d.sport_types?.length)setSports(d.sport_types.map(s=>({v:s.code,l:s.name,l_en:s.name_en,l_uz:s.name_uz,l_kz:s.name_kz,met:s.met,track_distance:s.track_distance,track_duration:s.track_duration,track_intensity:s.track_intensity,track_sets:s.track_sets,track_score:s.track_score})));
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
      <Hero style={{textAlign:"center",marginBottom:8}}>{t("record_btn")}</Hero>
      <div style={{color:C.muted,fontFamily:"monospace",fontSize:13,marginBottom:4}}>
        {SPORTS.find(s=>s.v===sport)?.l} · {duration} мин
      </div>
      {saved>0&&<div style={{color:C.accent,fontFamily:"monospace",fontSize:18,marginBottom:4}}>~{saved} ккал</div>}
      <div style={{color:C.success,fontSize:12,fontFamily:"monospace",marginBottom:24}}>{t("pts_bonus")}</div>
      <div style={{display:"flex",gap:10}}>
        <Btn full onClick={()=>{setSaved(null);setNotes("");setDuration("60");}} style={{flex:1}}>{t("another_one")}</Btn>
        <Btn accent full onClick={onBack} style={{flex:1}}>{t("back")}</Btn>
      </div>
    </div>
  );

  return<div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/>
    <Kicker>{t("sport_title2")}</Kicker>
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
            {tSport(s)||s.l}
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
    <Kicker>{t("gamification_title2")}</Kicker>
    <Hero style={{marginBottom:16}}>{t("gamification_title2")}</Hero>

    <Card style={{marginBottom:16,border:`0.5px solid ${rankColor}`,textAlign:"center",padding:"20px 16px"}}>
      <div style={{fontSize:48,marginBottom:8}}>{
        {beginner:"🥉",athlete:"🥈",champion:"🥇",legend:"💎"}[data.rank]||"🥉"
      }</div>
      <div style={{fontSize:22,fontWeight:700,color:rankColor,marginBottom:4}}>{data.rank_name}</div>
      <Mono size={32} color={rankColor}>{data.total_points}</Mono>
      <div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginTop:4}}>{t("pts_label")}</div>
      <div style={{fontSize:12,color:C.accent,fontFamily:"monospace",marginTop:8}}>
        AI запросов в день: {data.ai_limit}
      </div>
    </Card>

    {data.next_rank&&<Card style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <Kicker>{t("next_rank")}</Kicker>
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
      <Kicker>{t("how_earn")}</Kicker>
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

    {/* Streak rewards */}
    {data.streak_rewards?.length>0&&<Card style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <Kicker>{t("streak_series")}</Kicker>
        <Mono size={14}>{data.streak_days||0} дн.</Mono>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {data.streak_rewards.map((r,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",
            borderBottom:i<data.streak_rewards.length-1?`0.5px solid ${C.border}`:"none",
            opacity:r.unlocked?1:0.4}}>
            <span style={{fontSize:20,flexShrink:0}}>{r.emoji}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,color:r.unlocked?C.text:C.muted,fontWeight:r.unlocked?600:400}}>
                {r.name} {r.unlocked?"✓":""}
              </div>
              <div style={{fontSize:11,color:C.muted}}>{r.desc}</div>
            </div>
            <span style={{fontFamily:"monospace",fontSize:12,color:r.unlocked?C.accent:C.muted,flexShrink:0}}>
              +{r.pts}
            </span>
          </div>
        ))}
      </div>
    </Card>}

    {data.recent_points?.length>0&&<Card>
      <Kicker>{t("recent_points")}</Kicker>
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
    <Kicker>{t("referral_title2")}</Kicker>
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
        <Btn accent full onClick={shareLink} style={{flex:1}}>{t("share_btn2")}</Btn>
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
        <div style={{fontSize:11,color:C.muted}}>{t("pts_label")}</div>
      </Card>
    </div>

    <Card style={{marginBottom:16}}>
      <Kicker>{t("how_works")}</Kicker>
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
    <Kicker>{t("food_ref_section")}</Kicker><Hero>{sel.name}</Hero>
    <div style={{height:16}}/>
    <Card accent style={{marginBottom:10}}>
      <Kicker>{t("food_catalog_kbju")}</Kicker>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
        {[{l:"КАЛОРИИ",v:sel.kcal,u:"ккал"},{l:"БЕЛОК",v:sel.protein,u:"г"},{l:"ЖИРЫ",v:sel.fat,u:"г"},{l:"УГЛЕВОДЫ",v:sel.carb,u:"г"}].map((m,i)=><div key={i}><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>{m.l}</div><Mono size={14}>{m.v} <span style={{fontSize:11,color:C.muted,fontWeight:400}}>{m.u}</span></Mono></div>)}
      </div>
    </Card>
    {[{label:"⏰ КОГДА ЕСТЬ",value:sel.timing},{label:"💡 СОВЕТЫ",value:sel.tips},{label:"🏆 ЛУЧШИЕ ПРОДУКТЫ",value:sel.best},{label:"✅ СОЧЕТАЕТСЯ С",value:sel.combines},{label:"❌ НЕ СОЧЕТАТЬ",value:sel.avoid}].map((r,i)=><Card key={i} style={{marginBottom:8}}><Kicker>{r.label}</Kicker><div style={{fontSize:13,color:C.text,lineHeight:1.6,marginTop:4}}>{r.value}</div></Card>)}
  </div>;
  if(!cats)return <div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader/></div>;
  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>{t("supps_ref")}</Kicker><Hero>{t("food_catalog_section")}</Hero>
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
      <Kicker>{t("supps_cat")}</Kicker><Hero>{sel.name}</Hero>
      <div style={{marginTop:8,marginBottom:16,fontSize:12,color:C.muted,fontFamily:"monospace"}}>{sel.evidence}</div>
      {warnings.length>0&&warnings.map((w,i)=><div key={i} style={{background:"#FF444422",border:`0.5px solid ${C.danger}`,borderRadius:10,padding:"10px 14px",marginBottom:10,fontSize:13,color:C.danger}}>{w}</div>)}
      <Card accent style={{marginBottom:10}}>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:4}}>ДОЗА{weight?" (ТВОЙ ВЕС "+weight+"КГ)":""}</div><div style={{fontSize:14,color:C.accent,fontWeight:600}}>{personalDose(sel)}</div></div>
          <div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:4}}>{t("when_take_section")}</div><div style={{fontSize:14,color:C.accent,fontWeight:600}}>{sel.timing}</div></div>
        </div>
      </Card>
      <Card style={{marginBottom:10}}><Kicker>{t("supp_desc")}</Kicker><div style={{fontSize:14,color:C.text,lineHeight:1.6,marginTop:6}}>{sel.tips}</div></Card>
      {sel.links?.length>0&&<Card><Kicker>{t("supp_sources")}</Kicker><div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>{sel.links.map((l,i)=><button key={i} onClick={()=>{if(window.Telegram?.WebApp?.openLink)window.Telegram.WebApp.openLink(l.url);else window.open(l.url,'_blank');}} style={{background:"none",border:`0.5px solid ${C.accent}`,borderRadius:8,padding:"8px 12px",fontSize:13,color:C.accent,cursor:"pointer",display:"flex",alignItems:"center",gap:6,width:"100%",textAlign:"left"}}>🔗 {l.label}</button>)}</div></Card>}
    </div>;
  }

  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>{t("supps_ref")}</Kicker><Hero>{t("supps_title2")}</Hero>
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
                <div style={{fontWeight:600,fontSize:15,color:C.text}}>{tSport(s)||s.name}</div>
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
    <BackBtn onBack={onBack}/><Kicker>{t("measurements_cat")}</Kicker><Hero>{t("measurements_title2")}</Hero>
    <div style={{display:"flex",gap:0,margin:"16px 0",border:`0.5px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
      {[{id:"add",label:"ДОБАВИТЬ"},{id:"history",label:"ИСТОРИЯ"}].map(t=>(
        <button key={t.id} onClick={()=>setView(t.id)} style={{flex:1,padding:"10px",background:view===t.id?C.accent:C.card,border:"none",color:view===t.id?C.bg:C.muted,fontFamily:"monospace",fontSize:11,fontWeight:700,cursor:"pointer"}}>
          {t.label}
        </button>
      ))}
    </div>

    {view==="add"&&<>
      {saved&&<div style={{background:"#00CC6622",border:`0.5px solid ${C.success}`,borderRadius:10,padding:"10px 14px",marginBottom:12,fontFamily:"monospace",fontSize:12,color:C.success}}>{t("measurements_saved")}</div>}
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
      <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",textAlign:"center",marginTop:8}}>{t("measurements_hint")}</div>
    </>}

    {view==="history"&&(
      !history?<Loader text="ИСТОРИЯ"/>:
      history.length===0?<Card><div style={{textAlign:"center",padding:"16px 0",color:C.muted}}>{t("measurements_none")}</div></Card>:
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
  const sliders=[{key:"energy",label:t("energy_label"),lo:"😴",hi:"⚡"},{key:"sleep",label:t("sleep_label2"),lo:"😞",hi:"😴✨"},{key:"stress",label:t("stress_label"),lo:"😌",hi:"😤"},{key:"motivation",label:t("motivation_label"),lo:"😑",hi:"🔥"}];

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
    <Kicker>{t("checkin_weekly")}</Kicker><Hero>{t("checkin_title2")}</Hero>
    <Card style={{marginBottom:16}}>
      <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>
        {t("checkin_card_hint")}<br/>
        <span style={{color:C.accent}}>{t("ai_trainer_title")}</span> {t("checkin_card_hint2")}
      </div>
    </Card>
    <div style={{height:8}}/>
    {sent
      ?<Card accent><div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:32,color:C.accent}}>✓</div><div style={{fontFamily:"monospace",fontSize:13,color:C.accent,marginTop:8}}>{t("checkin_saved")}</div><div style={{fontSize:12,color:C.muted,marginTop:6}}>{t("checkin_ai_hint")}</div></div></Card>
      :<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <Card>
            <div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("weight_kg")}</div>
            <input type="number" step="0.1" value={form.weight} onChange={e=>setForm(p=>({...p,weight:e.target.value}))} placeholder="0.0"
              style={{background:"none",border:"none",color:C.accent,fontSize:26,fontFamily:"monospace",fontWeight:700,width:"100%",outline:"none"}}/>
          </Card>
          <Card>
            <div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{t("sleep_hours")}</div>
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
    <BackBtn onBack={onBack}/><Kicker>{t("settings_title")}</Kicker><Hero>{t("language_section")}</Hero><div style={{height:16}}/>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {langs.map(l=><Card key={l.code} onClick={()=>setLang(l.code)} accent={cur===l.code}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:16,color:C.text,fontWeight:cur===l.code?700:400}}>{l.label}</span>{cur===l.code&&<span style={{color:C.accent,fontFamily:"monospace",fontSize:12}}>{t("current_lang")}</span>}{saving===l.code&&<span style={{color:C.muted,fontFamily:"monospace",fontSize:11}}>...</span>}</div>
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
      else{setError(t("error_send"));}
    }catch{setError(t("error_conn2"));}
    finally{setSaving(false);}
  }
  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>{t("support_cat")}</Kicker><Hero>{t("support_title2")}</Hero><div style={{height:16}}/>
    {sent?<Card accent><div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:32,color:C.accent}}>✓</div><div style={{fontFamily:"monospace",fontSize:13,color:C.accent,marginTop:8}}>{t("sent")}</div></div></Card>:<>
      <Card style={{marginBottom:16}}><div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginBottom:10}}>{t("support_problem")}</div><textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Опишите ваше обращение, мы ответим в ближайшее время" rows={5} style={{width:"100%",background:"none",border:"none",color:C.text,fontSize:14,lineHeight:1.6,resize:"none",outline:"none",boxSizing:"border-box"}}/></Card>
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
    <BackBtn onBack={onBack}/><Kicker>{t("progress_title")}</Kicker><Hero>{t("goals_title2")}</Hero><div style={{height:16}}/>
    {!adding?<Btn accent full onClick={()=>setAdding(true)} style={{marginBottom:16}}>{t("goals_add")}</Btn>:
    <Card style={{marginBottom:16}}><Kicker>{t("new_goal")}</Kicker><div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
      <input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder={t("goal_desc")} style={{background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:14,outline:"none"}}/>
      <div style={{display:"flex",gap:8}}>
        <input type="number" value={form.target_value} onChange={e=>setForm(p=>({...p,target_value:e.target.value}))} placeholder="Цель" style={{flex:2,background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.accent,fontSize:14,fontFamily:"monospace",outline:"none"}}/>
        <input value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))} placeholder="ед." style={{flex:1,background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.muted,fontSize:14,outline:"none"}}/>
      </div>
      <input type="date" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))} style={{colorScheme:"dark",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.muted,fontSize:13,outline:"none"}}/>
      <div style={{display:"flex",gap:8}}><Btn full onClick={()=>setAdding(false)} style={{flex:1}}>{t("cancel_btn2")}</Btn><Btn accent full onClick={add} disabled={saving||!form.description.trim()} style={{flex:2}}>{saving?"...":t("save_profile")}</Btn></div>
    </div></Card>}
    {active.length===0&&!adding&&<Card style={{marginBottom:12}}><div style={{textAlign:"center",padding:"16px 0",color:C.muted}}>{t("no_goals")}</div></Card>}
    {active.map(g=><Card key={g.id} style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{fontWeight:600,fontSize:14,color:C.text,flex:1}}>{g.description}</div><Mono size={12}>{g.pct}%</Mono></div>
      <div style={{marginBottom:6}}><ProgressBar pct={g.pct}/></div>
      <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>{g.current_value}/{g.target_value} {g.unit}</span>{g.days_left!=null&&<span style={{fontSize:11,color:g.days_left<7?C.danger:C.muted,fontFamily:"monospace"}}>{g.days_left} дн.</span>}</div>
    </Card>)}
    {done.length>0&&<><Kicker style={{marginTop:16}}>{t("goal_achieved")}</Kicker>{done.map(g=><Card key={g.id} style={{marginBottom:8,opacity:0.6}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:14,color:C.success}}>✓ {g.description}</span><Mono size={12} color={C.success}>100%</Mono></div></Card>)}</>}
  </div>;
}

function RemindersScreen({tgId,onBack,onNav}){
  const [data,setData]=useState(null);
  useEffect(()=>{if(!tgId){setData({reminders:[]});return;}fetch(`${API}/reminders/${tgId}`).then(r=>r.json()).then(setData).catch(()=>setData({reminders:[]}));},[]);
  const fmt=iso=>{const d=new Date(iso);return d.toLocaleString("ru",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});};
  if(!data)return <div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader/></div>;
  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>{t("reminders_cat")}</Kicker><Hero>{t("reminders_title2")}</Hero><div style={{height:16}}/>
    <Card style={{marginBottom:16}}><div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>{t("bot_reminds2")} <span style={{color:C.accent}}>{t("hour_1")}</span> {t("before_workout")}<br/>{t("plateau_schedule")}</div></Card>
    <Kicker>{t("upcoming_workouts")}</Kicker>
    {data.reminders.length===0?<Card><div style={{textAlign:"center",padding:"16px 0"}}><div style={{color:C.muted,fontSize:14}}>{t("no_reminders")}</div><button onClick={()=>onNav("plan_workout")} style={{marginTop:10,background:"none",border:`0.5px solid ${C.accent}`,borderRadius:8,padding:"8px 16px",color:C.accent,fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>{t("add_plan")}</button></div></Card>:
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




// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
function LeaderboardScreen({tgId,onBack}){
  const [data,setData]=useState(null);
  useEffect(()=>{
    if(!tgId)return;
    fetch(`${API}/leaderboard?tg_id=${tgId}&limit=20`)
      .then(r=>r.json()).then(setData).catch(()=>setData(null));
  },[]);

  const rankColors={beginner:"#CD7F32",athlete:"#C0C0C0",champion:"#FFD700",legend:"#00FFFF"};
  const medals=["🥇","🥈","🥉"];

  if(!data)return<div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader text="ЗАГРУЗКА"/></div>;

  return<div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/>
    <Kicker>{t("rank_label2")}</Kicker>
    <Hero style={{marginBottom:16}}>{t("leaderboard_title")}</Hero>

    {/* Моя позиция */}
    {data.me&&<Card accent style={{marginBottom:16,textAlign:"center"}}>
      <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:4}}>{t("my_position")}</div>
      <div style={{fontSize:32,fontWeight:700,color:C.accent}}>#{data.my_position}</div>
      <div style={{fontSize:13,color:C.text,marginTop:4}}>{data.me.name} · {data.me.pts} балл.</div>
      <div style={{fontSize:11,color:C.muted,marginTop:2}}>{data.me.rank}</div>
    </Card>}

    {/* Топ лидеров */}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {(data.leaders||[]).map((l,i)=>(
        <Card key={i} style={{
          border:l.is_me?`0.5px solid ${C.accent}`:undefined,
          background:l.is_me?"rgba(200,255,0,0.05)":C.card,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:32,textAlign:"center",flexShrink:0}}>
              {i<3
                ?<span style={{fontSize:22}}>{medals[i]}</span>
                :<span style={{fontFamily:"monospace",fontSize:14,color:C.muted}}>#{l.position}</span>
              }
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:14,color:l.is_me?C.accent:C.text}}>
                {l.name}{l.is_me?" (ты)":""}
              </div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                {l.rank}
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <Mono size={16}>{l.pts}</Mono>
              <div style={{fontSize:10,color:C.muted}}>{t("pts_short")}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>

    {data.leaders?.length===0&&<Card>
      <div style={{textAlign:"center",padding:"20px 0",color:C.muted}}>
        Пока никто не в рейтинге. Тренируйся и зарабатывай баллы!
      </div>
    </Card>}
  </div>;
}

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────
function AchievementsScreen({tgId,onBack}){
  const [data,setData]=useState(null);
  useEffect(()=>{
    if(!tgId)return;
    fetch(`${API}/achievements/${tgId}`).then(r=>r.json()).then(setData).catch(()=>setData(null));
  },[]);

  if(!data)return<div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader text="ДОСТИЖЕНИЯ"/></div>;

  const unlocked=data.achievements.filter(a=>a.unlocked);
  const locked=data.achievements.filter(a=>!a.unlocked);

  return<div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/>
    <Kicker>{t("gamification_title2")}</Kicker>
    <Hero style={{marginBottom:8}}>{t("achievements_title2")}</Hero>
    <div style={{fontFamily:"monospace",fontSize:12,color:C.muted,marginBottom:20}}>
      ОТКРЫТО {data.unlocked_count} / {data.total}
    </div>

    {/* Прогресс-бар */}
    <Card style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <Kicker>{t("progress_title")}</Kicker>
        <span style={{fontFamily:"monospace",fontSize:11,color:C.accent}}>
          {Math.round(data.unlocked_count/data.total*100)}%
        </span>
      </div>
      <ProgressBar pct={Math.round(data.unlocked_count/data.total*100)}/>
    </Card>

    {/* Новые достижения */}
    {data.new?.length>0&&<div style={{marginBottom:16}}>
      {data.new.map((a,i)=>(
        <Card key={i} accent style={{marginBottom:8,padding:"12px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:32}}>{a.emoji}</span>
            <div>
              <div style={{fontSize:11,color:C.accent,fontFamily:"monospace",marginBottom:2}}>{t("new_achievement")}</div>
              <div style={{fontWeight:700,fontSize:15,color:C.text}}>{tField(a,"name")||a.name}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>{tField(a,"desc")||a.desc} · +{a.pts} балл.</div>
            </div>
          </div>
        </Card>
      ))}
    </div>}

    {/* Открытые */}
    {unlocked.length>0&&<>
      <Kicker style={{marginBottom:8}}>ОТКРЫТО ({unlocked.length})</Kicker>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {unlocked.map((a,i)=>(
          <Card key={i} style={{border:`0.5px solid ${C.accent}33`}}>
            <div style={{fontSize:28,marginBottom:6}}>{a.emoji}</div>
            <div style={{fontWeight:600,fontSize:13,color:C.text,marginBottom:3}}>{tField(a,"name")||a.name}</div>
            <div style={{fontSize:11,color:C.muted,lineHeight:1.4,marginBottom:6}}>{tField(a,"desc")||a.desc}</div>
            <div style={{fontFamily:"monospace",fontSize:11,color:C.accent}}>+{a.pts} балл.</div>
            {a.unlocked_at&&<div style={{fontSize:10,color:C.muted,marginTop:4,fontFamily:"monospace"}}>
              {new Date(a.unlocked_at).toLocaleDateString("ru",{day:"numeric",month:"short"})}
            </div>}
          </Card>
        ))}
      </div>
    </>}

    {/* Заблокированные */}
    {locked.length>0&&<>
      <Kicker style={{marginBottom:8}}>ЕЩЁ НЕ ОТКРЫТО ({locked.length})</Kicker>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {locked.map((a,i)=>(
          <Card key={i} style={{opacity:0.5}}>
            <div style={{fontSize:28,marginBottom:6,filter:"grayscale(1)"}}>🔒</div>
            <div style={{fontWeight:600,fontSize:13,color:C.muted,marginBottom:3}}>{tField(a,"name")||a.name}</div>
            <div style={{fontSize:11,color:C.muted,lineHeight:1.4,marginBottom:6}}>{tField(a,"desc")||a.desc}</div>
            <div style={{fontFamily:"monospace",fontSize:11,color:C.muted}}>+{a.pts} балл.</div>
          </Card>
        ))}
      </div>
    </>}
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
    if(startParam==="profile"){
      // Кнопки бота "Создать/Обновить/Изменить профиль" ведут сразу в Mini App
      setTimeout(()=>push("menu","profile",{}),500);
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
    if(screen==="active_workout")return <ActiveWorkoutScreen tgId={tgId} exercises={exercises} muscleGroups={muscleGroups} onBack={goBack} onFinish={()=>setWorkouts(null)} onFinishNav={()=>{setPlannedRefresh(r=>r+1);replace("workout",null,{});if(tgId)fetch(`${API}/workouts/${tgId}`).then(r=>r.json()).then(d=>setWorkouts(d.workouts||[])).catch(()=>setWorkouts([]));}} onNav={handleNav} preselectedExIds={p.preselectedExIds||[]} plannedWorkoutId={p.plannedWorkoutId||null} exerciseTips={p.exerciseTips||{}}/>;
    if(screen==="workout_detail")return <WorkoutDetailScreen workoutId={p.workoutId} tgId={tgId} onBack={goBack}/>;
    if(screen==="my_workouts_detail")return <MyWorkoutsDetailScreen tgId={tgId} onBack={goBack} onNav={handleNav}/>;
    if(screen==="planned_detail")return <PlannedDetailScreen pwId={p.pwId} tgId={tgId} onBack={goBack} exercises={exercises} muscleGroups={muscleGroups} readOnly={p.readOnly||false} onNav={handleNav}/>;
    if(screen==="plan_workout")return <PlanWorkoutScreen tgId={tgId} exercises={exercises} muscleGroups={muscleGroups} onBack={goBack}/>;
    if(screen==="goals")return <GoalsScreen tgId={tgId} onBack={goBack}/>;
    if(screen==="reminders")return <RemindersScreen tgId={tgId} onBack={goBack} onNav={handleNav}/>;
    if(screen==="food_vision")return <FoodVisionScreen tgId={tgId} onBack={goBack} mealType={p.meal_type}/>;
    if(screen==="sport_log")return <SportLogScreen tgId={tgId} onBack={goBack} initialSport={p.initial_sport||null}/>;
    if(screen==="referral")return <ReferralScreen tgId={tgId} onBack={goBack}/>;
    if(screen==="achievements")return <AchievementsScreen tgId={tgId} onBack={goBack}/>;
    if(screen==="leaderboard")return <LeaderboardScreen tgId={tgId} onBack={goBack}/>;
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
    if(tab==="menu")return <MenuScreen key={lang+"_"+menuRefresh} user={user} onNav={handleNav} activeWorkout={hasResumableActiveWorkout()}/>;
    if(tab==="workout")return <WorkoutHistoryScreen workouts={workouts} onNav={handleNav} tgId={tgId} refreshToken={plannedRefresh}/>;
    if(tab==="progress")return <ProgressScreen stats={stats} tgId={tgId}/>;
    if(tab==="catalog")return <CatalogScreen exercises={exercises} muscleGroups={muscleGroups}/>;
    if(tab==="ai")return <AIScreen user={user} tgId={tgId} onNav={handleNav} exercises={exercises}/>;
  }

  // Онбординг для новых пользователей
  if(user?._not_found)return<OnboardingScreen tgId={tgId} tgUser={tg?.initDataUnsafe?.user} onComplete={()=>{setUser(null);loadUser();}}/>;
  // Загрузка
  if(!user)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}><Loader text="ЗАГРУЗКА"/></div>;

  return <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",position:"relative"}}>
    <div style={{
      position:"fixed",inset:0,zIndex:0,pointerEvents:"none",
      backgroundImage:"url(/gymbot-miniapp/watermark.png)",
      backgroundRepeat:"no-repeat",
      backgroundPosition:"center 30%",
      backgroundSize:"min(420px, 90vw)",
    }}/>
    <div style={{position:"relative",zIndex:1}}>
      {render()}
      <NavBar active={tab} onChange={handleTabChange}/>
    </div>
  </div>;
}
