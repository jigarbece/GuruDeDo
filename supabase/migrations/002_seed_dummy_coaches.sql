-- =====================================================================
-- Gurudedo — 100 dummy coaches for Ahmedabad (seed / testing only)
-- Run in the Supabase SQL Editor.
-- All coaches are inserted as status = 'approved' and spread across
-- all 12 categories, 12 Ahmedabad areas, both genders, all teaching
-- modes, and a realistic range of fees / experience.
-- 8 coaches are marked featured = true.
-- =====================================================================

DO $$
DECLARE
  -- category IDs resolved by slug so UUIDs don't need to be hard-coded
  cat_academics    UUID;
  cat_music        UUID;
  cat_dance        UUID;
  cat_fitness      UUID;
  cat_art          UUID;
  cat_cooking      UUID;
  cat_beauty       UUID;
  cat_language     UUID;
  cat_tech         UUID;
  cat_spiritual    UUID;
  cat_photography  UUID;
  cat_other        UUID;
BEGIN
  SELECT id INTO cat_academics   FROM categories WHERE slug = 'academics'  LIMIT 1;
  SELECT id INTO cat_music       FROM categories WHERE slug = 'music'       LIMIT 1;
  SELECT id INTO cat_dance       FROM categories WHERE slug = 'dance'       LIMIT 1;
  SELECT id INTO cat_fitness     FROM categories WHERE slug = 'fitness'     LIMIT 1;
  SELECT id INTO cat_art         FROM categories WHERE slug = 'art'         LIMIT 1;
  SELECT id INTO cat_cooking     FROM categories WHERE slug = 'cooking'     LIMIT 1;
  SELECT id INTO cat_beauty      FROM categories WHERE slug = 'beauty'      LIMIT 1;
  SELECT id INTO cat_language    FROM categories WHERE slug = 'language'    LIMIT 1;
  SELECT id INTO cat_tech        FROM categories WHERE slug = 'tech'        LIMIT 1;
  SELECT id INTO cat_spiritual   FROM categories WHERE slug = 'spiritual'   LIMIT 1;
  SELECT id INTO cat_photography FROM categories WHERE slug = 'photography' LIMIT 1;
  SELECT id INTO cat_other       FROM categories WHERE slug = 'other'       LIMIT 1;

  INSERT INTO coaches (
    full_name, phone, whatsapp_number, email, city, area, pincode,
    category_id, sub_skills, experience_years,
    fee_min, fee_max, fee_type, teaching_mode,
    demo_available, bio, gender, languages, status, featured
  ) VALUES

  -- ── ACADEMICS (10 coaches) ───────────────────────────────────────────
  (
    'Ankit Sharma', '9876500101', '9876500101', 'ankit.sharma@email.com',
    'Ahmedabad', 'Bopal', '380058',
    cat_academics, ARRAY['Mathematics','Physics','Chemistry'], 8,
    2000, 4000, 'monthly', 'home_visit', true,
    'I am a dedicated CBSE and ICSE tutor with 8 years of experience teaching Maths and Science to students from Class 6 to 12. My teaching style focuses on building strong fundamentals through practice problems and visual explanations. Students consistently improve by 2 grades within 3 months.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', true
  ),
  (
    'Priya Desai', '9876500102', '9876500102', 'priya.desai@email.com',
    'Ahmedabad', 'Satellite', '380015',
    cat_academics, ARRAY['English','History','Geography'], 6,
    1500, 3000, 'monthly', 'home_visit', true,
    'Experienced humanities tutor specialising in English literature, History, and Geography for Classes 8 to 12. I use storytelling and mind-maps to make social science interesting and memorable. Board exam students regularly score above 90% under my guidance.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Rajan Patel', '9876500103', '9876500103', 'rajan.patel@email.com',
    'Ahmedabad', 'Navrangpura', '380009',
    cat_academics, ARRAY['Mathematics','Statistics','Accountancy'], 12,
    2500, 5000, 'monthly', 'center', true,
    'Senior faculty with 12 years of coaching experience for Commerce stream — CA Foundation, Mathematics, Statistics, and Accountancy. I run a small coaching centre in Navrangpura with structured batch and individual slots. Proven track record with CA Foundation students.',
    'Male', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Neha Joshi', '9876500104', '9876500104', 'neha.joshi@email.com',
    'Ahmedabad', 'Vastrapur', '380015',
    cat_academics, ARRAY['Biology','Science','EVS'], 5,
    1500, 2500, 'monthly', 'home_visit', true,
    'Biology and Science tutor for Classes 6 to 10 with 5 years of home tutoring experience. I explain complex biological concepts through diagrams and real-world examples. Special focus on NCERT and Gujarat Board syllabus. Fun and engaging sessions guaranteed.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Suresh Mehta', '9876500105', '9876500105', 'suresh.mehta@email.com',
    'Ahmedabad', 'Maninagar', '380008',
    cat_academics, ARRAY['Mathematics','Physics'], 10,
    1800, 3500, 'monthly', 'all', true,
    'IIT graduate with 10 years of teaching Maths and Physics for JEE, NEET, and Class 11-12. I offer both online and home visit sessions. My problem-solving approach has helped over 200 students crack competitive exams. Free demo class always available.',
    'Male', ARRAY['Hindi','English'], 'approved', true
  ),
  (
    'Kavita Shah', '9876500106', '9876500106', 'kavita.shah@email.com',
    'Ahmedabad', 'Thaltej', '380054',
    cat_academics, ARRAY['English','Spoken English','Creative Writing'], 7,
    1500, 3000, 'monthly', 'online', true,
    'English language and literature specialist for school and college students. 7 years teaching experience with focus on grammar, writing skills, and public speaking. Online sessions are interactive with worksheets and live feedback. IELTS and spoken English coaching also available.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Deepak Trivedi', '9876500107', '9876500107', 'deepak.trivedi@email.com',
    'Ahmedabad', 'Gota', '380060',
    cat_academics, ARRAY['Computer Science','Programming Basics','Python'], 4,
    1200, 2500, 'monthly', 'home_visit', true,
    'Computer Science teacher for Classes 9 to 12 (CBSE/GSEB). Covers programming basics, Python, SQL, and networking. 4 years of school teaching plus private tutoring experience. I make coding fun with mini-projects and real examples.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Pooja Agarwal', '9876500108', '9876500108', 'pooja.agarwal@email.com',
    'Ahmedabad', 'Chandkheda', '382424',
    cat_academics, ARRAY['Mathematics','Science','Hindi'], 3,
    1000, 2000, 'monthly', 'home_visit', true,
    'Home tutor for primary and middle school students (Classes 1 to 8). I cover all subjects with a patient and child-friendly approach. Specialise in making Maths and Science easy with activity-based learning. 3 years of experience with 30+ students.',
    'Female', ARRAY['Hindi','Gujarati'], 'approved', false
  ),
  (
    'Harshil Modi', '9876500109', '9876500109', 'harshil.modi@email.com',
    'Ahmedabad', 'Prahlad Nagar', '380015',
    cat_academics, ARRAY['Physics','Chemistry','Mathematics'], 9,
    3000, 6000, 'monthly', 'center', true,
    'Running a dedicated coaching institute for JEE and NEET aspirants in Prahlad Nagar for the past 9 years. Small batch size (max 8 students) ensures personalised attention. Physics, Chemistry, and Maths covered with weekly tests and doubt sessions.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Mital Panchal', '9876500110', '9876500110', 'mital.panchal@email.com',
    'Ahmedabad', 'Ellis Bridge', '380006',
    cat_academics, ARRAY['Accountancy','Economics','Business Studies'], 6,
    1800, 3500, 'monthly', 'home_visit', true,
    'Commerce tutor for Class 11-12 and BBA students. 6 years of teaching Accountancy, Economics, and Business Studies. I simplify journal entries and financial statements with real business examples. Board exam preparation is my specialty.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),

  -- ── MUSIC (10 coaches) ───────────────────────────────────────────────
  (
    'Rohan Vyas', '9876500201', '9876500201', 'rohan.vyas@email.com',
    'Ahmedabad', 'Satellite', '380015',
    cat_music, ARRAY['Guitar','Ukulele','Music Theory'], 10,
    2000, 4000, 'monthly', 'home_visit', true,
    'Professional guitarist and music teacher with 10 years of experience. I teach acoustic, electric, and classical guitar from beginner to advanced level. Also cover basic music theory and chord construction. Students of all ages welcome. Fun and structured lessons with tabs and backing tracks.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', true
  ),
  (
    'Sonal Bhatt', '9876500202', '9876500202', 'sonal.bhatt@email.com',
    'Ahmedabad', 'Navrangpura', '380009',
    cat_music, ARRAY['Hindustani Vocal','Bhajan','Raga'], 15,
    2500, 5000, 'monthly', 'center', true,
    'Trained in Hindustani classical music from Gandharva Mahavidyalaya with 15 years of teaching experience. I teach Hindustani vocal, bhajans, and light music. Conducting classes at my music center in Navrangpura. Students prepared for Visharad and Prabhakar examinations.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Amit Trivedi', '9876500203', '9876500203', 'amit.trivedi@email.com',
    'Ahmedabad', 'Bopal', '380058',
    cat_music, ARRAY['Keyboard','Piano','Music Theory'], 8,
    2000, 4500, 'monthly', 'all', true,
    'Keyboard and piano teacher for beginners to intermediate players. 8 years of experience teaching Western and Bollywood music. I use Trinity and ABRSM grade system for structured learning. Online sessions available with digital keyboard. Fun repertoire including film songs and pop.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Ritu Kapoor', '9876500204', '9876500204', 'ritu.kapoor@email.com',
    'Ahmedabad', 'Vastrapur', '380015',
    cat_music, ARRAY['Tabla','Pakhawaj','Rhythm'], 12,
    2000, 3500, 'monthly', 'home_visit', true,
    'Tabla player trained under Pandit Vikram Ghosh school of thought. 12 years of professional performance and 8 years of teaching. I teach from basic bol-bani to complex taal structures. Suitable for beginners and students preparing for classical music exams.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Kiran Jain', '9876500205', '9876500205', 'kiran.jain@email.com',
    'Ahmedabad', 'Maninagar', '380008',
    cat_music, ARRAY['Violin','Western Classical','String Instruments'], 7,
    2500, 5000, 'monthly', 'center', true,
    'Violin teacher trained in Western classical tradition. 7 years of teaching at music academies and privately. Cover beginner to Grade 8 ABRSM syllabus. Also teach basic music reading and theory alongside instrument practice.',
    'Male', ARRAY['Hindi','English'], 'approved', false
  ),
  (
    'Falak Shaikh', '9876500206', '9876500206', 'falak.shaikh@email.com',
    'Ahmedabad', 'Gota', '380060',
    cat_music, ARRAY['Singing','Bollywood Singing','Western Vocals'], 5,
    1500, 3000, 'monthly', 'online', true,
    'Singing coach specialising in Bollywood and light music for 5 years. Online lessons via Zoom with recorded feedback. I teach breath control, pitch correction, and stage performance. Students have performed at local events and college fests.',
    'Female', ARRAY['Hindi','Gujarati','English'], 'approved', false
  ),
  (
    'Neel Parikh', '9876500207', '9876500207', 'neel.parikh@email.com',
    'Ahmedabad', 'Thaltej', '380054',
    cat_music, ARRAY['Flute','Bansuri','Indian Classical'], 9,
    1800, 3500, 'monthly', 'home_visit', true,
    'Bansuri and flute teacher with 9 years of experience in Hindustani classical music. I teach raag-based playing with proper breath technique and fingering. Students from age 8 upwards. Also offer workshops for corporate groups interested in stress relief through flute.',
    'Male', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Disha Choksi', '9876500208', '9876500208', 'disha.choksi@email.com',
    'Ahmedabad', 'Chandkheda', '382424',
    cat_music, ARRAY['Western Vocals','Choir','Music Theory'], 6,
    2000, 3500, 'monthly', 'center', false,
    'Western vocal coach and choir director with 6 years of teaching experience. I run a small choir group and also offer individual vocal lessons. Focus on breathing technique, harmony, and performance. Students of all ages and levels welcome.',
    'Female', ARRAY['English','Hindi'], 'approved', false
  ),
  (
    'Varun Solanki', '9876500209', '9876500209', 'varun.solanki@email.com',
    'Ahmedabad', 'Prahlad Nagar', '380015',
    cat_music, ARRAY['Drums','Djembe','Rhythm Training'], 7,
    2000, 4000, 'monthly', 'center', true,
    'Drum kit and djembe teacher with performance experience at multiple venues in Ahmedabad. 7 years of teaching from basics to advanced grooves. I teach reading drum notation and improvisation. Best drum studio setup for practice sessions.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Mansi Rajput', '9876500210', '9876500210', 'mansi.rajput@email.com',
    'Ahmedabad', 'Ellis Bridge', '380006',
    cat_music, ARRAY['Harmonium','Bhajan','Devotional Music'], 11,
    1500, 3000, 'monthly', 'home_visit', true,
    'Harmonium player and bhajan teacher with 11 years of experience. I specialise in devotional music, aarti singing, and light classical. Suitable for all age groups. Also offer group bhajan sessions at homes and societies on request.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', false
  ),

  -- ── DANCE (8 coaches) ────────────────────────────────────────────────
  (
    'Shreya Nair', '9876500301', '9876500301', 'shreya.nair@email.com',
    'Ahmedabad', 'Satellite', '380015',
    cat_dance, ARRAY['Bharatanatyam','Mohiniyattam','Abhinaya'], 14,
    2500, 5000, 'monthly', 'center', true,
    'Bharatanatyam dancer and teacher trained under Kalakshetra tradition with 14 years of performance and teaching experience. I teach from Adavu basics to full Margam. Students prepared for Rangapravesh and Visharad examinations. Running my own dance academy in Satellite.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', true
  ),
  (
    'Jiya Rao', '9876500302', '9876500302', 'jiya.rao@email.com',
    'Ahmedabad', 'Bopal', '380058',
    cat_dance, ARRAY['Bollywood Dance','Contemporary','Hip Hop'], 6,
    1500, 3000, 'monthly', 'center', true,
    'Bollywood and contemporary dance teacher with 6 years of experience. I teach Bollywood choreography, freestyle, and beginner Hip Hop. Fun classes for kids and adults. Regular performance opportunities at events and competitions. Batch classes available.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Mihir Shah', '9876500303', '9876500303', 'mihir.shah@email.com',
    'Ahmedabad', 'Navrangpura', '380009',
    cat_dance, ARRAY['Kathak','Classical Dance','Taal'], 10,
    2000, 4000, 'monthly', 'center', false,
    'Kathak dancer trained in Jaipur Gharana with 10 years of teaching experience. I cover tatkar, chakkar, tora, and tukra with proper taal training. Students prepared for Prayag Sangeet Samiti examinations. Individual and small group batches available.',
    'Male', ARRAY['Hindi','Gujarati'], 'approved', false
  ),
  (
    'Anika Menon', '9876500304', '9876500304', 'anika.menon@email.com',
    'Ahmedabad', 'Vastrapur', '380015',
    cat_dance, ARRAY['Zumba','Aerobics','Dance Fitness'], 5,
    1200, 2500, 'monthly', 'center', true,
    'Certified Zumba instructor and dance fitness trainer with 5 years of experience. High-energy classes combining Latin dance rhythms with fitness. Morning and evening batch options. Suitable for all fitness levels. Group discount available for societies.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Arjun Pillai', '9876500305', '9876500305', 'arjun.pillai@email.com',
    'Ahmedabad', 'Maninagar', '380008',
    cat_dance, ARRAY['Western Dance','Freestyle','Break Dance'], 7,
    1800, 3500, 'monthly', 'center', true,
    'Western dance coach specialising in freestyle, locking, and breaking. 7 years of teaching and competition experience. I teach footwork, flow, and battle techniques. Regular workshops and practice jams organised. Students have won city-level competitions.',
    'Male', ARRAY['Hindi','English'], 'approved', false
  ),
  (
    'Riya Chauhan', '9876500306', '9876500306', 'riya.chauhan@email.com',
    'Ahmedabad', 'Thaltej', '380054',
    cat_dance, ARRAY['Classical Dance','Garba','Folk Dance'], 8,
    1500, 3000, 'monthly', 'home_visit', true,
    'Folk and Garba dance teacher with 8 years of experience. I teach traditional Gujarati Garba, Dandiya, and other folk dance forms. Perfect for school events, Navratri preparation, and general fitness. Home visits and society classes available.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Dev Trivedi', '9876500307', '9876500307', 'dev.trivedi@email.com',
    'Ahmedabad', 'Gota', '380060',
    cat_dance, ARRAY['Bollywood Dance','Wedding Choreography'], 4,
    2000, 5000, 'per_session', 'all', true,
    'Bollywood dance choreographer and teacher with 4 years of experience. Specialise in wedding choreography for sangeet functions. Also teach regular Bollywood dance classes. Online session available for non-Ahmedabad clients. Portfolio available on request.',
    'Male', ARRAY['Hindi','Gujarati','English'], 'approved', false
  ),
  (
    'Tanvi Kulkarni', '9876500308', '9876500308', 'tanvi.kulkarni@email.com',
    'Ahmedabad', 'Chandkheda', '382424',
    cat_dance, ARRAY['Ballet','Contemporary','Creative Dance'], 9,
    3000, 6000, 'monthly', 'center', true,
    'Ballet and contemporary dance teacher trained at Mumbai Dance Academy. 9 years of teaching classical ballet and contemporary movement to children and adults. Small class sizes to ensure proper technique. Annual recital organised for students.',
    'Female', ARRAY['English','Hindi'], 'approved', false
  ),

  -- ── FITNESS & YOGA (8 coaches) ───────────────────────────────────────
  (
    'Siddharth Rao', '9876500401', '9876500401', 'siddharth.rao@email.com',
    'Ahmedabad', 'Prahlad Nagar', '380015',
    cat_fitness, ARRAY['Yoga','Hatha Yoga','Pranayama'], 10,
    1500, 3000, 'monthly', 'home_visit', true,
    'Certified yoga instructor (RYT 500) with 10 years of practice and 6 years of teaching. I teach Hatha yoga, pranayama, and meditation for stress management and flexibility. Morning slots available. Home visits and society group sessions. Special classes for seniors and pregnant women.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', true
  ),
  (
    'Divya Pillai', '9876500402', '9876500402', 'divya.pillai@email.com',
    'Ahmedabad', 'Satellite', '380015',
    cat_fitness, ARRAY['Zumba Fitness','Aerobics','HIIT'], 5,
    1200, 2500, 'monthly', 'center', true,
    'Licensed Zumba instructor and group fitness trainer. 5 years of conducting high-energy Zumba and aerobics classes. Morning batches for women at my fitness studio in Satellite. Focus on fun, cardio, and body toning. Beginners to advanced all welcome.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Raj Iyer', '9876500403', '9876500403', 'raj.iyer@email.com',
    'Ahmedabad', 'Bopal', '380058',
    cat_fitness, ARRAY['Personal Training','Weight Training','Calisthenics'], 8,
    2500, 5000, 'monthly', 'home_visit', true,
    'Certified personal trainer (ACE) with 8 years of experience in strength training and body transformation. I visit client homes with portable equipment. Customised workout and diet plans provided. Specialise in weight loss, muscle gain, and athletic performance.',
    'Male', ARRAY['Hindi','English'], 'approved', false
  ),
  (
    'Meena Sharma', '9876500404', '9876500404', 'meena.sharma@email.com',
    'Ahmedabad', 'Navrangpura', '380009',
    cat_fitness, ARRAY['Power Yoga','Ashtanga Yoga','Meditation'], 7,
    2000, 4000, 'monthly', 'center', false,
    'Power yoga and Ashtanga yoga instructor with 7 years of teaching in Ahmedabad. I run structured 60-minute classes focusing on strength, flexibility, and mindfulness. Regular workshops on stress management and breath work. Certified from Yoga Alliance India.',
    'Female', ARRAY['Hindi','Gujarati','English'], 'approved', false
  ),
  (
    'Gaurav Sinha', '9876500405', '9876500405', 'gaurav.sinha@email.com',
    'Ahmedabad', 'Maninagar', '380008',
    cat_fitness, ARRAY['CrossFit','Functional Training','Nutrition'], 6,
    2000, 4000, 'monthly', 'center', true,
    'CrossFit Level 2 certified coach with 6 years of experience. I run CrossFit and functional training sessions focusing on whole-body fitness. Nutrition guidance included. Small group sessions with max 6 people for quality coaching. Results-oriented approach.',
    'Male', ARRAY['Hindi','English'], 'approved', false
  ),
  (
    'Sunita Verma', '9876500406', '9876500406', 'sunita.verma@email.com',
    'Ahmedabad', 'Vastrapur', '380015',
    cat_fitness, ARRAY['Yoga','Prenatal Yoga','Senior Fitness'], 12,
    1500, 3000, 'monthly', 'home_visit', true,
    'Yoga therapist specialising in prenatal yoga, postnatal recovery, and senior fitness for 12 years. Gentle and therapeutic approach tailored to individual health conditions. Home visits only. Also conduct online sessions for clients with mobility limitations.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Pratik Joshi', '9876500407', '9876500407', 'pratik.joshi@email.com',
    'Ahmedabad', 'Gota', '380060',
    cat_fitness, ARRAY['Gym Training','Bodybuilding','Nutrition Planning'], 5,
    1800, 3500, 'monthly', 'center', true,
    'Gym trainer and bodybuilding coach with 5 years of experience. I offer personalised training programs for muscle building, weight loss, and general fitness. Certified nutritionist who provides diet charts along with training plans. Group discounts for friends joining together.',
    'Male', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Prerna Das', '9876500408', '9876500408', 'prerna.das@email.com',
    'Ahmedabad', 'Thaltej', '380054',
    cat_fitness, ARRAY['Yoga','Yin Yoga','Restorative Yoga'], 8,
    2000, 4000, 'monthly', 'online', true,
    'Yin and restorative yoga teacher with 8 years of experience, specialising in deep relaxation and joint health. Online classes conducted via Zoom with props and alignment guidance. Ideal for those with desk jobs, stress, or recovery from injuries. Weekend batch available.',
    'Female', ARRAY['Hindi','English'], 'approved', false
  ),

  -- ── ART & DRAWING (7 coaches) ────────────────────────────────────────
  (
    'Kinjal Shah', '9876500501', '9876500501', 'kinjal.shah@email.com',
    'Ahmedabad', 'Satellite', '380015',
    cat_art, ARRAY['Sketching','Portrait Drawing','Charcoal Art'], 9,
    1500, 3000, 'monthly', 'home_visit', true,
    'Fine arts graduate from MS University Baroda with 9 years of teaching drawing and sketching. I cover pencil sketching, portrait drawing, and charcoal techniques. Students from Class 5 to college level and adults. Personalised approach to develop individual artistic style.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Vishal Mehta', '9876500502', '9876500502', 'vishal.mehta@email.com',
    'Ahmedabad', 'Navrangpura', '380009',
    cat_art, ARRAY['Watercolor','Oil Painting','Acrylic Painting'], 11,
    2000, 4000, 'monthly', 'center', true,
    'Watercolor and oil painting artist with 11 years of teaching experience. I run a studio-style art class in Navrangpura where students work on projects at their own pace. Weekend batches available. Materials provided for first two sessions. All age groups welcome.',
    'Male', ARRAY['Gujarati','Hindi'], 'approved', true
  ),
  (
    'Rupa Patel', '9876500503', '9876500503', 'rupa.patel@email.com',
    'Ahmedabad', 'Bopal', '380058',
    cat_art, ARRAY['Mandala Art','Zentangle','Doodling'], 4,
    1000, 2000, 'monthly', 'home_visit', true,
    'Mandala and Zentangle art teacher with 4 years of experience. Therapeutic art forms that help reduce stress while developing creativity. I teach beginners and intermediates. Home visit classes in Bopal and nearby areas. Also conduct group workshops for corporates and societies.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Yash Trivedi', '9876500504', '9876500504', 'yash.trivedi@email.com',
    'Ahmedabad', 'Vastrapur', '380015',
    cat_art, ARRAY['Digital Art','Illustration','Graphic Design Basics'], 6,
    2000, 4000, 'monthly', 'online', true,
    'Digital artist and illustrator with 6 years of professional design experience and 4 years of teaching. I teach digital drawing using Procreate and Photoshop, illustration techniques, and basic graphic design. Online classes with screen share and real-time feedback.',
    'Male', ARRAY['Hindi','English'], 'approved', false
  ),
  (
    'Hetal Joshi', '9876500505', '9876500505', 'hetal.joshi@email.com',
    'Ahmedabad', 'Maninagar', '380008',
    cat_art, ARRAY['Rangoli','Traditional Art','Warli Painting'], 7,
    800, 1500, 'monthly', 'home_visit', true,
    'Traditional Indian art teacher specialising in Rangoli, Warli painting, and Madhubani art. 7 years of teaching these beautiful traditional forms to children and adults. Perfect for school competitions, festive decoration, and cultural appreciation.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Anand Kapoor', '9876500506', '9876500506', 'anand.kapoor@email.com',
    'Ahmedabad', 'Gota', '380060',
    cat_art, ARRAY['Pottery','Clay Modelling','Sculpture'], 8,
    2500, 5000, 'monthly', 'center', false,
    'Potter and sculptor with 8 years of teaching wheel-throwing and hand-building techniques. Studio classes in Gota with all materials provided. Students learn to make functional pottery and decorative sculptures. Weekend workshops also available for beginners.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Bhavna Solanki', '9876500507', '9876500507', 'bhavna.solanki@email.com',
    'Ahmedabad', 'Thaltej', '380054',
    cat_art, ARRAY['Sketching','Anime Drawing','Comics'], 3,
    1000, 2000, 'monthly', 'home_visit', true,
    'Anime and comics art teacher with 3 years of experience. I teach manga-style drawing, character design, and comic strip creation. Perfect for kids and teenagers who love anime. Fun and encouraging approach that builds drawing confidence quickly.',
    'Female', ARRAY['Hindi','English'], 'approved', false
  ),

  -- ── COOKING & BAKING (6 coaches) ─────────────────────────────────────
  (
    'Nalini Patel', '9876500601', '9876500601', 'nalini.patel@email.com',
    'Ahmedabad', 'Bopal', '380058',
    cat_cooking, ARRAY['Baking','Cake Decoration','Bread Making'], 8,
    1500, 3000, 'monthly', 'home_visit', true,
    'Professional baker and baking teacher with 8 years of experience. I teach home baking from basics (muffins, cookies) to advanced techniques (fondant cakes, croissants, sourdough bread). Classes at your kitchen or mine. All ingredients arranged in advance.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', true
  ),
  (
    'Smita Sharma', '9876500602', '9876500602', 'smita.sharma@email.com',
    'Ahmedabad', 'Satellite', '380015',
    cat_cooking, ARRAY['Gujarati Cooking','Indian Thali','Pickles & Preserves'], 12,
    1000, 2000, 'monthly', 'center', true,
    'Home chef with 12 years of teaching authentic Gujarati and Indian cooking. I run weekend cooking classes from my home kitchen. Cover dal-dhokli, shrikhand, farsan, and festive menus. Focus on traditional recipes with modern presentation.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Alok Varma', '9876500603', '9876500603', 'alok.varma@email.com',
    'Ahmedabad', 'Navrangpura', '380009',
    cat_cooking, ARRAY['Continental Cooking','Italian','French Cuisine'], 7,
    2000, 4000, 'monthly', 'center', true,
    'Trained chef with hotel management background teaching continental cuisine. 7 years of teaching Italian, French, and fusion cooking. Classes focus on knife skills, sauces, and plating. Home kitchen setup with professional tools. Certificate provided on completion.',
    'Male', ARRAY['Hindi','English'], 'approved', false
  ),
  (
    'Rekha Jain', '9876500604', '9876500604', 'rekha.jain@email.com',
    'Ahmedabad', 'Vastrapur', '380015',
    cat_cooking, ARRAY['Tiffin Business Training','Meal Prep','Healthy Cooking'], 5,
    1200, 2500, 'monthly', 'home_visit', true,
    'Healthy cooking and meal prep coach for 5 years. I teach nutritious meal planning, balanced Indian cooking, and how to start a home tiffin business. Special focus on diabetic-friendly and heart-healthy recipes. Online consultation also available.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Chirag Patel', '9876500605', '9876500605', 'chirag.patel@email.com',
    'Ahmedabad', 'Maninagar', '380008',
    cat_cooking, ARRAY['Street Food','Chaat Making','Snacks'], 4,
    800, 1500, 'monthly', 'center', true,
    'Street food enthusiast and cooking teacher specialising in authentic chaat, vada pav, and Indian snacks. 4 years of teaching small groups to replicate popular street food at home. Great for beginners and food lovers. Weekend batch classes available.',
    'Male', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Darshana Modi', '9876500606', '9876500606', 'darshana.modi@email.com',
    'Ahmedabad', 'Chandkheda', '382424',
    cat_cooking, ARRAY['Chocolate Making','Desserts','Sugar Craft'], 6,
    2000, 4000, 'per_session', 'center', true,
    'Chocolate and dessert specialist with 6 years of teaching artisan chocolate making, bonbons, and sugar craft. I run workshop-style classes for individuals and groups. Perfect for gifting business startups. All materials provided. Certificates issued for completed courses.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),

  -- ── BEAUTY & SALON (6 coaches) ───────────────────────────────────────
  (
    'Prachi Shah', '9876500701', '9876500701', 'prachi.shah@email.com',
    'Ahmedabad', 'Satellite', '380015',
    cat_beauty, ARRAY['Makeup','Bridal Makeup','HD Makeup'], 8,
    3000, 8000, 'per_session', 'home_visit', true,
    'Professional makeup artist and trainer with 8 years of experience. I teach bridal, party, and HD makeup techniques. Training courses for beginners who want to start their makeup career. Certificate courses with hands-on practice on real models. Kit guidance provided.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Hina Amin', '9876500702', '9876500702', 'hina.amin@email.com',
    'Ahmedabad', 'Bopal', '380058',
    cat_beauty, ARRAY['Hair Styling','Hair Coloring','Keratin Treatment'], 10,
    2500, 5000, 'monthly', 'center', true,
    'Senior hair stylist and beauty trainer with 10 years of salon experience. I teach haircutting, styling, coloring, and keratin treatment techniques. Course designed for those wanting to work in salons or start their own. Practical training with real clients.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', true
  ),
  (
    'Sunanda Joshi', '9876500703', '9876500703', 'sunanda.joshi@email.com',
    'Ahmedabad', 'Navrangpura', '380009',
    cat_beauty, ARRAY['Mehendi','Bridal Mehendi','Arabic Mehendi'], 7,
    1000, 3000, 'per_session', 'home_visit', true,
    'Professional mehendi artist and trainer with 7 years of experience in bridal, Arabic, and contemporary designs. I teach mehendi as a skill for personal use or as a career. Course covers cone making, design practice, and business tips. Home visit classes available.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Kavya Pandey', '9876500704', '9876500704', 'kavya.pandey@email.com',
    'Ahmedabad', 'Vastrapur', '380015',
    cat_beauty, ARRAY['Nail Art','Gel Nails','Nail Extensions'], 4,
    2000, 5000, 'monthly', 'center', true,
    'Nail art specialist and trainer with 4 years of experience in gel nails, nail extensions, and nail art designs. I teach basic to advanced nail techniques in small batches. Kit list provided. Great option for those looking to start a nail service business from home.',
    'Female', ARRAY['Hindi','English'], 'approved', false
  ),
  (
    'Dimple Rao', '9876500705', '9876500705', 'dimple.rao@email.com',
    'Ahmedabad', 'Maninagar', '380008',
    cat_beauty, ARRAY['Facial','Skin Care','Beauty Therapy'], 9,
    2000, 4000, 'monthly', 'center', false,
    'Beauty therapist with 9 years of experience in skincare, facials, and holistic beauty treatments. Teaching beauty therapy courses for aspiring beauticians. Covers facial techniques, skincare analysis, and product knowledge. Certificate on completion of course.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Roshni Desai', '9876500706', '9876500706', 'roshni.desai@email.com',
    'Ahmedabad', 'Thaltej', '380054',
    cat_beauty, ARRAY['Eyebrow Threading','Waxing','Beauty Basics'], 5,
    1500, 3000, 'monthly', 'home_visit', true,
    'Beauty basics trainer with 5 years of experience teaching threading, waxing, and basic salon services. Ideal for beginners wanting to start their own beauty service. Home-based training available. Practical sessions included with proper hygiene and safety protocols.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', false
  ),

  -- ── LANGUAGE (8 coaches) ─────────────────────────────────────────────
  (
    'Farida Khan', '9876500801', '9876500801', 'farida.khan@email.com',
    'Ahmedabad', 'Satellite', '380015',
    cat_language, ARRAY['Spoken English','IELTS','Communication Skills'], 10,
    2000, 4000, 'monthly', 'center', true,
    'Spoken English and IELTS trainer with 10 years of experience. My structured communication skills program covers grammar, pronunciation, vocabulary, and confidence building. Individual and group batches available. IELTS Band 8 achieved personally. 95% students show significant improvement.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', true
  ),
  (
    'Pierre Martin', '9876500802', '9876500802', 'pierre.martin@email.com',
    'Ahmedabad', 'Navrangpura', '380009',
    cat_language, ARRAY['French','DELF Preparation','French Culture'], 8,
    2500, 5000, 'monthly', 'online', true,
    'Native French speaker and certified Alliance Française teacher. 8 years of teaching French from A1 to C1 levels. Online sessions with interactive materials and conversation practice. Prepare students for DELF/DALF exams. Cultural immersion approach to language learning.',
    'Male', ARRAY['French','English','Hindi'], 'approved', false
  ),
  (
    'Sakura Tanaka', '9876500803', '9876500803', 'sakura.tanaka@email.com',
    'Ahmedabad', 'Bopal', '380058',
    cat_language, ARRAY['Japanese','JLPT Preparation','Japanese Culture'], 6,
    2500, 5000, 'monthly', 'online', true,
    'Japanese language teacher from Osaka with 6 years of teaching experience. Cover Hiragana, Katakana, Kanji, and conversational Japanese. Prepare students for JLPT N5 to N3. Online sessions with anime and manga examples to make learning fun and engaging.',
    'Female', ARRAY['Japanese','English','Hindi'], 'approved', false
  ),
  (
    'Mehmet Yilmaz', '9876500804', '9876500804', 'mehmet.yilmaz@email.com',
    'Ahmedabad', 'Vastrapur', '380015',
    cat_language, ARRAY['German','Goethe Certificate','Business German'], 7,
    2500, 5000, 'monthly', 'online', false,
    'German language teacher and certified Goethe Institut examiner. 7 years of teaching German for beginners, business professionals, and students planning to study in Germany. Online classes with structured curriculum and exam preparation support.',
    'Male', ARRAY['German','English','Hindi'], 'approved', false
  ),
  (
    'Ramona Santos', '9876500805', '9876500805', 'ramona.santos@email.com',
    'Ahmedabad', 'Maninagar', '380008',
    cat_language, ARRAY['Spanish','DELE Exam','Latin American Spanish'], 5,
    2000, 4000, 'monthly', 'online', true,
    'Spanish language teacher from Colombia with 5 years of teaching Latin American Spanish. Cover A1 to B2 levels with a focus on conversational fluency. DELE exam preparation available. Fun classes with music, movies, and cultural activities.',
    'Female', ARRAY['Spanish','English'], 'approved', false
  ),
  (
    'Sunil Shukla', '9876500806', '9876500806', 'sunil.shukla@email.com',
    'Ahmedabad', 'Gota', '380060',
    cat_language, ARRAY['Sanskrit','Vedic Sanskrit','Shlokas'], 15,
    1500, 3000, 'monthly', 'home_visit', true,
    'Sanskrit teacher with 15 years of experience teaching classical and Vedic Sanskrit. I cover grammar, shloka pronunciation, and Bhagavad Gita study. Home visits and online sessions available. Suitable for school students and spiritual seekers.',
    'Male', ARRAY['Sanskrit','Gujarati','Hindi'], 'approved', false
  ),
  (
    'Natasha Roy', '9876500807', '9876500807', 'natasha.roy@email.com',
    'Ahmedabad', 'Thaltej', '380054',
    cat_language, ARRAY['Spoken English','Personality Development','Interview Prep'], 6,
    2000, 4000, 'monthly', 'center', true,
    'English communication coach and soft skills trainer. 6 years of corporate training and coaching experience. I teach spoken English, personality development, interview preparation, and group discussion skills. Batches for college students and working professionals.',
    'Female', ARRAY['Hindi','English'], 'approved', false
  ),
  (
    'Arun Kumar', '9876500808', '9876500808', 'arun.kumar@email.com',
    'Ahmedabad', 'Chandkheda', '382424',
    cat_language, ARRAY['Hindi','Hindi Literature','Spoken Hindi'], 8,
    1000, 2000, 'monthly', 'home_visit', true,
    'Hindi language teacher with 8 years of experience teaching spoken Hindi, grammar, and literature to non-Hindi speakers and school students. I also teach Hindi to expat professionals settling in Ahmedabad. Patient and structured approach.',
    'Male', ARRAY['Hindi','Gujarati','English'], 'approved', false
  ),

  -- ── TECH & CODING (9 coaches) ────────────────────────────────────────
  (
    'Rahul Verma', '9876500901', '9876500901', 'rahul.verma@email.com',
    'Ahmedabad', 'Prahlad Nagar', '380015',
    cat_tech, ARRAY['Python','Data Science','Machine Learning'], 7,
    3000, 8000, 'monthly', 'online', true,
    'Data Scientist and Python trainer with 7 years of industry experience at tech companies. I teach Python programming, Pandas, NumPy, Scikit-learn, and intro to ML. Project-based curriculum with real datasets. Certificate of completion provided. Batch of max 5 for quality learning.',
    'Male', ARRAY['Hindi','English'], 'approved', true
  ),
  (
    'Ankita Singh', '9876500902', '9876500902', 'ankita.singh@email.com',
    'Ahmedabad', 'Satellite', '380015',
    cat_tech, ARRAY['Web Development','HTML','CSS','JavaScript'], 5,
    2500, 6000, 'monthly', 'online', true,
    'Full-stack web developer and coding instructor with 5 years of teaching experience. I teach HTML, CSS, JavaScript, React, and Node.js in a structured project-based curriculum. Perfect for beginners wanting to become developers or freelancers. Portfolio projects included.',
    'Female', ARRAY['Hindi','English'], 'approved', false
  ),
  (
    'Dev Shah', '9876500903', '9876500903', 'dev.shah@email.com',
    'Ahmedabad', 'Navrangpura', '380009',
    cat_tech, ARRAY['Mobile App Development','Flutter','Dart'], 4,
    3000, 7000, 'monthly', 'online', true,
    'Flutter developer with 4 years of experience building mobile apps. I teach Flutter and Dart from zero to publishing apps on Play Store and App Store. Hands-on project approach: students build 3 real apps during the course. Industry-ready curriculum.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Pooja Nair', '9876500904', '9876500904', 'pooja.nair@email.com',
    'Ahmedabad', 'Bopal', '380058',
    cat_tech, ARRAY['UI/UX Design','Figma','Product Design'], 5,
    2500, 5000, 'monthly', 'online', false,
    'UI/UX designer at a product company with 5 years of experience. I teach Figma, design thinking, user research, and prototyping. Suitable for designers, developers, and entrepreneurs who want to build better products. Portfolio review included.',
    'Female', ARRAY['Hindi','English'], 'approved', false
  ),
  (
    'Mehul Patel', '9876500905', '9876500905', 'mehul.patel@email.com',
    'Ahmedabad', 'Vastrapur', '380015',
    cat_tech, ARRAY['Java','Android Development','Object Oriented Programming'], 8,
    2500, 6000, 'monthly', 'center', true,
    'Java and Android development trainer with 8 years of experience in software industry and training institutes. I teach Core Java, OOP concepts, and Android app development. Course covers interview preparation and placement assistance. Classroom sessions in Vastrapur.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Kirti Acharya', '9876500906', '9876500906', 'kirti.acharya@email.com',
    'Ahmedabad', 'Maninagar', '380008',
    cat_tech, ARRAY['Digital Marketing','SEO','Social Media Marketing'], 6,
    2000, 5000, 'monthly', 'online', true,
    'Digital marketing professional with 6 years of agency experience. I teach SEO, Google Ads, social media marketing, email marketing, and analytics. Practical curriculum with real campaign work. Perfect for business owners and aspiring digital marketers.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Rushabh Shah', '9876500907', '9876500907', 'rushabh.shah@email.com',
    'Ahmedabad', 'Gota', '380060',
    cat_tech, ARRAY['Excel','MS Office','Data Analysis'], 5,
    1500, 3000, 'monthly', 'home_visit', true,
    'MS Office and Excel trainer with 5 years of corporate training experience. I teach Excel from basic formulas to advanced pivot tables, VLOOKUP, dashboards, and macros. Also cover Word and PowerPoint. Home visits for working professionals and retired individuals.',
    'Male', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Nita Bhavsar', '9876500908', '9876500908', 'nita.bhavsar@email.com',
    'Ahmedabad', 'Thaltej', '380054',
    cat_tech, ARRAY['Tally','GST','Accounting Software'], 9,
    1500, 3000, 'monthly', 'center', true,
    'Tally and GST trainer with 9 years of experience teaching accounting software to students and small business owners. Cover Tally Prime, GST filing, inventory management, and payroll. Weekend and weekday batches available. Certificate provided.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Aryan Mishra', '9876500909', '9876500909', 'aryan.mishra@email.com',
    'Ahmedabad', 'Chandkheda', '382424',
    cat_tech, ARRAY['Cybersecurity','Ethical Hacking','Networking'], 6,
    4000, 10000, 'monthly', 'online', true,
    'Cybersecurity analyst and ethical hacking trainer with 6 years of industry experience. CEH certified. I teach network security, penetration testing, and ethical hacking fundamentals. Practical lab exercises with virtual machines. Great for IT professionals and students.',
    'Male', ARRAY['Hindi','English'], 'approved', false
  ),

  -- ── SPIRITUAL & MEDITATION (5 coaches) ──────────────────────────────
  (
    'Swami Anand', '9876501001', '9876501001', 'swami.anand@email.com',
    'Ahmedabad', 'Satellite', '380015',
    cat_spiritual, ARRAY['Meditation','Mindfulness','Vipassana'], 20,
    1000, 3000, 'monthly', 'center', true,
    'Meditation and mindfulness teacher with 20 years of practice and 10 years of teaching experience. Trained in Vipassana and Buddhist meditation traditions. I conduct group meditations, individual sessions, and corporate mindfulness workshops. Creating peace one breath at a time.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Gayatri Devi', '9876501002', '9876501002', 'gayatri.devi@email.com',
    'Ahmedabad', 'Navrangpura', '380009',
    cat_spiritual, ARRAY['Yoga Nidra','Chakra Healing','Reiki'], 15,
    2000, 5000, 'monthly', 'home_visit', true,
    'Holistic healer and spiritual teacher with 15 years of practice in Yoga Nidra, chakra healing, Reiki, and guided meditation. I offer individual healing sessions and group workshops. Deeply transformative practices for stress, anxiety, and spiritual growth.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Ramesh Prajapati', '9876501003', '9876501003', 'ramesh.prajapati@email.com',
    'Ahmedabad', 'Bopal', '380058',
    cat_spiritual, ARRAY['Meditation','Pranayama','Astrology'], 12,
    1500, 3000, 'monthly', 'center', false,
    'Meditation and pranayama teacher with 12 years of experience. I also offer Vedic astrology readings and guidance sessions. Weekly meditation circles open to all. My approach combines ancient Indian wisdom with practical modern applications for daily life.',
    'Male', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Anupama Gupta', '9876501004', '9876501004', 'anupama.gupta@email.com',
    'Ahmedabad', 'Vastrapur', '380015',
    cat_spiritual, ARRAY['Art of Living','Sudarshan Kriya','Meditation'], 8,
    2000, 4000, 'monthly', 'center', true,
    'Certified Art of Living teacher with 8 years of conducting happiness programs, Sudarshan Kriya workshops, and meditation retreats. I bring proven breathing and meditation techniques that reduce stress and improve overall wellbeing. Regular follow-up sessions included.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Kailash Trivedi', '9876501005', '9876501005', 'kailash.trivedi@email.com',
    'Ahmedabad', 'Maninagar', '380008',
    cat_spiritual, ARRAY['Bhagavad Gita Study','Philosophy','Spirituality'], 18,
    500, 2000, 'monthly', 'center', true,
    'Spiritual teacher and Bhagavad Gita scholar with 18 years of study and teaching experience. I conduct regular satsang, Gita study sessions, and spiritual discourse groups. Open to all seekers regardless of background. Donation-based model for genuine seekers.',
    'Male', ARRAY['Gujarati','Hindi','Sanskrit'], 'approved', false
  ),

  -- ── PHOTOGRAPHY (6 coaches) ──────────────────────────────────────────
  (
    'Ronak Joshi', '9876501101', '9876501101', 'ronak.joshi@email.com',
    'Ahmedabad', 'Prahlad Nagar', '380015',
    cat_photography, ARRAY['Portrait Photography','Lightroom','Camera Basics'], 7,
    3000, 6000, 'monthly', 'center', true,
    'Professional photographer and photography teacher with 7 years of commercial and teaching experience. I teach DSLR basics, composition, lighting, and Lightroom post-processing. Workshop-style classes with outdoor shooting assignments. Portfolio building guidance included.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', true
  ),
  (
    'Priyanka Mehta', '9876501102', '9876501102', 'priyanka.mehta@email.com',
    'Ahmedabad', 'Satellite', '380015',
    cat_photography, ARRAY['Wedding Photography','Event Photography','Photo Editing'], 8,
    3500, 7000, 'monthly', 'center', true,
    'Wedding and event photographer with 8 years of professional experience and 4 years of teaching. I teach wedding photography workflow, couple posing, lighting setups, and Photoshop editing. Mentorship for aspiring wedding photographers includes second-shooting opportunities.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Jigar Rana', '9876501103', '9876501103', 'jigar.rana@email.com',
    'Ahmedabad', 'Navrangpura', '380009',
    cat_photography, ARRAY['Product Photography','Food Photography','Studio Lighting'], 6,
    4000, 8000, 'monthly', 'center', false,
    'Commercial photographer specialising in product and food photography. 6 years of working with brands and e-commerce companies. I teach studio lighting, product styling, and post-processing techniques. Ideal for entrepreneurs, restaurant owners, and aspiring commercial photographers.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Malti Shah', '9876501104', '9876501104', 'malti.shah@email.com',
    'Ahmedabad', 'Bopal', '380058',
    cat_photography, ARRAY['Mobile Photography','Instagram Content','Reels'], 3,
    1500, 3000, 'monthly', 'online', true,
    'Mobile photography and content creation coach with 3 years of experience. I teach smartphone photography, lighting hacks, Reels and Instagram content strategy. Perfect for bloggers, small business owners, and social media enthusiasts. Online sessions available.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Vivek Pillai', '9876501105', '9876501105', 'vivek.pillai@email.com',
    'Ahmedabad', 'Vastrapur', '380015',
    cat_photography, ARRAY['Wildlife Photography','Nature Photography','Telephoto'], 10,
    4000, 8000, 'monthly', 'center', true,
    'Wildlife and nature photographer with 10 years of field experience across India. I teach wildlife photography techniques, telephoto lens usage, patience, and ethics of wildlife photography. Weekend field trips to Nal Sarovar and Gir included for advanced students.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Seema Trivedi', '9876501106', '9876501106', 'seema.trivedi@email.com',
    'Ahmedabad', 'Maninagar', '380008',
    cat_photography, ARRAY['Videography','Video Editing','YouTube Content'], 5,
    3000, 6000, 'monthly', 'online', true,
    'Videographer and video editing trainer with 5 years of experience. I teach video production basics, DaVinci Resolve editing, YouTube content strategy, and storytelling through video. Online curriculum with practical assignments. Great for aspiring YouTubers and content creators.',
    'Female', ARRAY['Hindi','English'], 'approved', false
  ),

  -- ── OTHER SKILLS (6 coaches) ─────────────────────────────────────────
  (
    'Bharat Solanki', '9876501201', '9876501201', 'bharat.solanki@email.com',
    'Ahmedabad', 'Gota', '380060',
    cat_other, ARRAY['Chess','Strategy Games','Problem Solving'], 12,
    1000, 2000, 'monthly', 'center', true,
    'FIDE rated chess player and coach with 12 years of teaching experience. I coach children and adults from beginner to tournament level. Regular participation in state and national events. My students have won school and district level tournaments.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Archana Patel', '9876501202', '9876501202', 'archana.patel@email.com',
    'Ahmedabad', 'Thaltej', '380054',
    cat_other, ARRAY['Stitching','Embroidery','Fashion Designing'], 9,
    1500, 3000, 'monthly', 'home_visit', true,
    'Fashion design and stitching teacher with 9 years of experience. I teach tailoring from basic stitching to garment construction, embroidery, and fashion sketching. Home visit classes available in Thaltej and nearby areas. Suitable for beginners and those wanting to start a tailoring business.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Nilesh Joshi', '9876501203', '9876501203', 'nilesh.joshi@email.com',
    'Ahmedabad', 'Ellis Bridge', '380006',
    cat_other, ARRAY['Public Speaking','Debate','Presentation Skills'], 8,
    2500, 5000, 'monthly', 'center', true,
    'Toastmasters Distinguished Toastmaster and public speaking coach with 8 years of experience. I train students and professionals in public speaking, debate, storytelling, and presentation skills. Regular speaking opportunities in club sessions. Corporate batches also available.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Priti Desai', '9876501204', '9876501204', 'priti.desai@email.com',
    'Ahmedabad', 'Prahlad Nagar', '380015',
    cat_other, ARRAY['Interior Design','Space Planning','Vastu'], 10,
    3000, 8000, 'per_session', 'home_visit', true,
    'Interior design consultant and teacher with 10 years of residential project experience. I offer home visit consultations and also teach interior design basics as a course. Covers space planning, colour theory, furniture selection, and Vastu principles. Great for homeowners and aspiring designers.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', true
  ),
  (
    'Sanjay Kumar', '9876501205', '9876501205', 'sanjay.kumar@email.com',
    'Ahmedabad', 'Chandkheda', '382424',
    cat_other, ARRAY['Swimming','Water Safety','Aqua Fitness'], 15,
    2000, 4000, 'monthly', 'center', true,
    'National level swimmer and swimming coach with 15 years of teaching experience. I coach beginners to competitive swimmers. Classes at a certified pool in Chandkheda. Focus on technique, endurance, and water safety. Kids and adult batches separately.',
    'Male', ARRAY['Hindi','Gujarati','English'], 'approved', false
  ),
  (
    'Leena Mehta', '9876501206', '9876501206', 'leena.mehta@email.com',
    'Ahmedabad', 'Satellite', '380015',
    cat_other, ARRAY['Flower Arrangement','Ikebana','Event Decoration'], 6,
    1500, 3000, 'monthly', 'home_visit', true,
    'Flower arrangement and Ikebana teacher with 6 years of experience. I teach Japanese Ikebana, western floral design, and event decoration. Weekend workshops for hobbyists and courses for those wanting to start a floral decoration business. All materials arranged for class.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', false
  ),

  -- ── EXTRA (11 more coaches for 100 total) ────────────────────────────
  (
    'Jignesh Patel', '9876501301', '9876501301', 'jignesh.patel@email.com',
    'Ahmedabad', 'Bopal', '380058',
    cat_academics, ARRAY['English','Spoken English','Grammar'], 5,
    1200, 2500, 'monthly', 'home_visit', true,
    'English teacher with 5 years of experience coaching school students and working professionals. I focus on grammar correction, vocabulary building, and fluency through daily conversation practice. Highly patient approach for slow learners. Classes available morning and evening slots.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Foram Shah', '9876501302', '9876501302', 'foram.shah@email.com',
    'Ahmedabad', 'Prahlad Nagar', '380015',
    cat_fitness, ARRAY['Pilates','Core Strength','Posture Correction'], 6,
    2500, 5000, 'monthly', 'center', true,
    'Certified Pilates instructor with 6 years of experience. I teach mat and reformer Pilates focusing on core strength, posture correction, and body alignment. Small group sessions of maximum 4 ensure personal attention. Great for desk workers and those with back pain.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Tejas Trivedi', '9876501303', '9876501303', 'tejas.trivedi@email.com',
    'Ahmedabad', 'Gota', '380060',
    cat_music, ARRAY['Harmonica','Mouth Organ','Blues Music'], 5,
    1000, 2000, 'monthly', 'home_visit', true,
    'Harmonica player and teacher with 5 years of experience teaching diatonic and chromatic harmonica. I cover blues, folk, and Bollywood styles. Very portable instrument — I bring everything needed to your home. Perfect hobby for adults and a fun instrument for kids.',
    'Male', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Shraddha Vora', '9876501304', '9876501304', 'shraddha.vora@email.com',
    'Ahmedabad', 'Ellis Bridge', '380006',
    cat_dance, ARRAY['Salsa','Bachata','Latin Dance'], 7,
    2000, 4000, 'monthly', 'center', true,
    'Latin dance instructor specialising in Salsa and Bachata with 7 years of performance and teaching experience. Partner and solo classes available. I run regular social dance nights where students can practice with others. Friendly and supportive atmosphere for all levels.',
    'Female', ARRAY['Hindi','English','Gujarati'], 'approved', false
  ),
  (
    'Krunal Modi', '9876501305', '9876501305', 'krunal.modi@email.com',
    'Ahmedabad', 'Satellite', '380015',
    cat_tech, ARRAY['AutoCAD','SolidWorks','CAD Design'], 9,
    2500, 5000, 'monthly', 'center', true,
    'CAD/CAM engineer and AutoCAD trainer with 9 years of experience in manufacturing and design. I teach 2D drafting, 3D modelling with SolidWorks, and AutoCAD for architectural and mechanical applications. Industry-standard training useful for engineering students and professionals.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Zara Sheikh', '9876501306', '9876501306', 'zara.sheikh@email.com',
    'Ahmedabad', 'Maninagar', '380008',
    cat_beauty, ARRAY['Hijab Styling','Modest Fashion','Personal Styling'], 4,
    1500, 3000, 'per_session', 'home_visit', true,
    'Personal stylist and hijab styling trainer with 4 years of experience. I teach hijab wrapping styles, modest fashion coordination, and personal colour analysis. Home visit sessions in Ahmedabad. Great for brides, students, and working women wanting to elevate their style.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Vinay Sharma', '9876501307', '9876501307', 'vinay.sharma@email.com',
    'Ahmedabad', 'Navrangpura', '380009',
    cat_cooking, ARRAY['BBQ','Grilling','Outdoor Cooking'], 5,
    2000, 4000, 'per_session', 'center', true,
    'BBQ and outdoor cooking enthusiast and teacher with 5 years of conducting fun cooking workshops. I teach grilling techniques, marinades, and outdoor cooking methods. Group workshops perfect for families, friends, and corporate team outings. All equipment and ingredients provided.',
    'Male', ARRAY['Hindi','English'], 'approved', false
  ),
  (
    'Hansa Patel', '9876501308', '9876501308', 'hansa.patel@email.com',
    'Ahmedabad', 'Chandkheda', '382424',
    cat_art, ARRAY['Fabric Painting','Tie Dye','Textile Art'], 8,
    1000, 2500, 'monthly', 'home_visit', true,
    'Textile and fabric art teacher with 8 years of experience. I teach fabric painting, block printing, tie-dye, and Bandhani techniques. Home visit classes in Chandkheda and nearby areas. Great hobby class for adults and a creative activity for school children.',
    'Female', ARRAY['Gujarati','Hindi'], 'approved', false
  ),
  (
    'Devang Amin', '9876501309', '9876501309', 'devang.amin@email.com',
    'Ahmedabad', 'Vastrapur', '380015',
    cat_other, ARRAY['Stock Market','Trading','Financial Literacy'], 8,
    3000, 7000, 'monthly', 'online', true,
    'Stock market trader and financial education coach with 8 years of trading experience and 4 years of teaching. I teach technical analysis, fundamental analysis, option strategies, and risk management. Practical trading sessions with live market observations. SEBI guidelines strictly followed.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Mona Kapadia', '9876501310', '9876501310', 'mona.kapadia@email.com',
    'Ahmedabad', 'Thaltej', '380054',
    cat_spiritual, ARRAY['Crystal Healing','Tarot','Energy Healing'], 7,
    2000, 5000, 'per_session', 'home_visit', true,
    'Crystal healer and Tarot reader with 7 years of practice and 4 years of teaching crystal healing and Tarot reading as skills. I offer individual healing sessions and teach workshops on crystal properties, grid making, and Tarot card interpretation. Compassionate and grounded approach.',
    'Female', ARRAY['Gujarati','Hindi','English'], 'approved', false
  ),
  (
    'Ravi Bhatt', '9876501311', '9876501311', 'ravi.bhatt@email.com',
    'Ahmedabad', 'Gota', '380060',
    cat_photography, ARRAY['Drone Photography','Aerial Videography','DJI'], 4,
    5000, 12000, 'monthly', 'center', true,
    'DGCA-certified drone pilot and aerial photography trainer with 4 years of experience. I teach drone flying basics, aerial composition, and video editing for drone footage. Practical flying sessions at open grounds. Ideal for photographers, filmmakers, and real estate professionals.',
    'Male', ARRAY['Gujarati','Hindi','English'], 'approved', false
  );

END $$;
