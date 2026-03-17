// Seed script for curated exercise database
import mysql from "mysql2/promise";

const WORKOUT_TYPE_IMAGE_LIBRARY = {
  weights: ["/exercise-images/weights.svg"],
  plyometrics: ["/exercise-images/plyometrics.svg"],
  cardio: ["/exercise-images/cardio.svg"],
  hiit: ["/exercise-images/hiit.svg"],
  yoga: ["/exercise-images/yoga.svg"],
  stretching: ["/exercise-images/stretching.svg"],
  calisthenics: ["/exercise-images/calisthenics.svg"],
  bodyweight: ["/exercise-images/bodyweight.svg"],
  crossfit: ["/exercise-images/crossfit.svg"],
  sport_specific: ["/exercise-images/sport_specific.svg"],
};

function getCuratedImageUrls(workoutType) {
  return WORKOUT_TYPE_IMAGE_LIBRARY[workoutType] ?? [];
}

const exercises = [
  // === WEIGHT TRAINING ===
  { name: "Barbell Bench Press", description: "Compound chest exercise performed lying on a flat bench.", instructions: "Lie on a flat bench, grip the barbell slightly wider than shoulder-width. Lower the bar to your mid-chest, then press up until arms are fully extended.", workoutType: "weights", muscleGroups: ["chest", "triceps", "shoulders"], equipment: "barbell", difficulty: "intermediate" },
  { name: "Barbell Squat", description: "Fundamental lower body compound movement.", instructions: "Place barbell on upper back, feet shoulder-width apart. Bend knees and hips to lower until thighs are parallel to floor, then drive up through heels.", workoutType: "weights", muscleGroups: ["quadriceps", "glutes", "hamstrings", "core"], equipment: "barbell", difficulty: "intermediate" },
  { name: "Deadlift", description: "Full body compound lift targeting posterior chain.", instructions: "Stand with feet hip-width, grip barbell just outside knees. Keep back flat, drive through heels to stand up, extending hips and knees simultaneously.", workoutType: "weights", muscleGroups: ["hamstrings", "glutes", "back", "core", "traps"], equipment: "barbell", difficulty: "advanced" },
  { name: "Overhead Press", description: "Standing shoulder press with barbell.", instructions: "Stand with barbell at shoulder height, press overhead until arms lock out. Keep core tight and avoid excessive back arch.", workoutType: "weights", muscleGroups: ["shoulders", "triceps", "core"], equipment: "barbell", difficulty: "intermediate" },
  { name: "Barbell Row", description: "Bent-over rowing movement for back development.", instructions: "Hinge at hips with barbell hanging at arm's length. Pull barbell to lower chest, squeezing shoulder blades together.", workoutType: "weights", muscleGroups: ["back", "biceps", "rear_delts"], equipment: "barbell", difficulty: "intermediate" },
  { name: "Dumbbell Curl", description: "Isolation exercise for bicep development.", instructions: "Stand holding dumbbells at sides, palms forward. Curl weights up by bending elbows, squeeze at top, lower with control.", workoutType: "weights", muscleGroups: ["biceps"], equipment: "dumbbells", difficulty: "beginner" },
  { name: "Dumbbell Lateral Raise", description: "Isolation exercise targeting side deltoids.", instructions: "Stand with dumbbells at sides. Raise arms out to sides until parallel with floor, slight bend in elbows. Lower slowly.", workoutType: "weights", muscleGroups: ["shoulders"], equipment: "dumbbells", difficulty: "beginner" },
  { name: "Dumbbell Chest Fly", description: "Chest isolation exercise on a flat bench.", instructions: "Lie on bench with dumbbells above chest, arms slightly bent. Lower arms out to sides in an arc, then squeeze back together.", workoutType: "weights", muscleGroups: ["chest"], equipment: "dumbbells", difficulty: "beginner" },
  { name: "Tricep Dips", description: "Compound pushing exercise for triceps and chest.", instructions: "Support yourself on parallel bars, lower body by bending elbows until upper arms are parallel to floor, then press back up.", workoutType: "weights", muscleGroups: ["triceps", "chest", "shoulders"], equipment: "dip_station", difficulty: "intermediate" },
  { name: "Leg Press", description: "Machine-based lower body compound exercise.", instructions: "Sit in leg press machine, place feet shoulder-width on platform. Lower platform by bending knees, then press back up.", workoutType: "weights", muscleGroups: ["quadriceps", "glutes", "hamstrings"], equipment: "machine", difficulty: "beginner" },
  { name: "Lat Pulldown", description: "Machine exercise targeting the latissimus dorsi.", instructions: "Sit at lat pulldown machine, grip bar wider than shoulders. Pull bar down to upper chest, squeezing lats, then control back up.", workoutType: "weights", muscleGroups: ["back", "biceps"], equipment: "machine", difficulty: "beginner" },
  { name: "Cable Face Pull", description: "Rear delt and upper back exercise using cables.", instructions: "Set cable at face height with rope attachment. Pull rope toward face, separating ends, squeezing rear delts.", workoutType: "weights", muscleGroups: ["rear_delts", "traps", "rotator_cuff"], equipment: "cable_machine", difficulty: "beginner" },
  { name: "Dumbbell Shoulder Press", description: "Seated or standing overhead press with dumbbells.", instructions: "Hold dumbbells at shoulder height, press overhead until arms extend fully. Lower with control.", workoutType: "weights", muscleGroups: ["shoulders", "triceps"], equipment: "dumbbells", difficulty: "beginner" },
  { name: "Romanian Deadlift", description: "Hip hinge movement targeting hamstrings and glutes.", instructions: "Hold barbell at hip height, push hips back while lowering bar along legs. Keep slight knee bend, feel hamstring stretch.", workoutType: "weights", muscleGroups: ["hamstrings", "glutes", "back"], equipment: "barbell", difficulty: "intermediate" },
  { name: "Incline Dumbbell Press", description: "Upper chest focused pressing movement.", instructions: "Set bench to 30-45 degrees. Press dumbbells from shoulder level to full extension above upper chest.", workoutType: "weights", muscleGroups: ["chest", "shoulders", "triceps"], equipment: "dumbbells", difficulty: "intermediate" },
  { name: "Hammer Curl", description: "Bicep curl variation with neutral grip.", instructions: "Hold dumbbells with palms facing each other. Curl up keeping neutral grip throughout the movement.", workoutType: "weights", muscleGroups: ["biceps", "forearms"], equipment: "dumbbells", difficulty: "beginner" },
  { name: "Skull Crushers", description: "Lying tricep extension with barbell or EZ bar.", instructions: "Lie on bench, hold bar above chest with narrow grip. Lower bar toward forehead by bending elbows, then extend back up.", workoutType: "weights", muscleGroups: ["triceps"], equipment: "barbell", difficulty: "intermediate" },
  { name: "Leg Curl", description: "Machine exercise isolating hamstrings.", instructions: "Lie face down on leg curl machine. Curl weight up by bending knees, squeeze hamstrings at top, lower with control.", workoutType: "weights", muscleGroups: ["hamstrings"], equipment: "machine", difficulty: "beginner" },
  { name: "Leg Extension", description: "Machine exercise isolating quadriceps.", instructions: "Sit in leg extension machine, extend legs until straight, squeeze quads at top, lower with control.", workoutType: "weights", muscleGroups: ["quadriceps"], equipment: "machine", difficulty: "beginner" },
  { name: "Cable Tricep Pushdown", description: "Cable isolation exercise for triceps.", instructions: "Stand at cable machine with rope or bar attachment at high position. Push down by extending elbows, squeeze triceps.", workoutType: "weights", muscleGroups: ["triceps"], equipment: "cable_machine", difficulty: "beginner" },

  // === PLYOMETRICS ===
  { name: "Box Jumps", description: "Explosive lower body plyometric exercise.", instructions: "Stand facing a box, swing arms and jump onto the box landing softly with both feet. Step down and repeat.", workoutType: "plyometrics", muscleGroups: ["quadriceps", "glutes", "calves"], equipment: "plyo_box", difficulty: "intermediate" },
  { name: "Jump Squats", description: "Explosive bodyweight squat with jump.", instructions: "Perform a squat, then explode upward jumping as high as possible. Land softly and immediately go into next rep.", workoutType: "plyometrics", muscleGroups: ["quadriceps", "glutes", "calves"], equipment: "none", difficulty: "intermediate" },
  { name: "Burpees", description: "Full body explosive exercise combining squat, plank, and jump.", instructions: "Drop into squat, kick feet back to plank, perform push-up, jump feet forward, then explode upward.", workoutType: "plyometrics", muscleGroups: ["full_body"], equipment: "none", difficulty: "intermediate" },
  { name: "Tuck Jumps", description: "High-intensity plyometric jump bringing knees to chest.", instructions: "Jump vertically, pulling knees toward chest at peak. Land softly and immediately repeat.", workoutType: "plyometrics", muscleGroups: ["quadriceps", "core", "calves"], equipment: "none", difficulty: "advanced" },
  { name: "Lateral Bounds", description: "Side-to-side explosive jumping movement.", instructions: "Stand on one leg, jump laterally to the opposite leg. Stick the landing, then bound back.", workoutType: "plyometrics", muscleGroups: ["glutes", "quadriceps", "adductors"], equipment: "none", difficulty: "intermediate" },
  { name: "Depth Jumps", description: "Advanced plyometric dropping from a box and immediately jumping.", instructions: "Step off a box, land briefly, then immediately explode upward into a maximum jump.", workoutType: "plyometrics", muscleGroups: ["quadriceps", "glutes", "calves"], equipment: "plyo_box", difficulty: "advanced" },
  { name: "Plyo Push-Ups", description: "Explosive push-up where hands leave the ground.", instructions: "Perform a push-up, pushing explosively so hands leave the floor. Land softly and repeat.", workoutType: "plyometrics", muscleGroups: ["chest", "triceps", "shoulders"], equipment: "none", difficulty: "advanced" },
  { name: "Skater Jumps", description: "Lateral bounding mimicking skating motion.", instructions: "Jump laterally from one foot to the other, swinging arms for momentum. Land softly on one foot.", workoutType: "plyometrics", muscleGroups: ["glutes", "quadriceps", "calves"], equipment: "none", difficulty: "beginner" },

  // === CARDIO ===
  { name: "Running", description: "Steady-state cardiovascular exercise.", instructions: "Maintain a consistent pace at moderate intensity. Focus on proper form: upright posture, relaxed shoulders, midfoot strike.", workoutType: "cardio", muscleGroups: ["quadriceps", "hamstrings", "calves", "core"], equipment: "none", difficulty: "beginner" },
  { name: "Cycling", description: "Low-impact cardiovascular exercise on a bike.", instructions: "Maintain steady cadence at moderate resistance. Keep core engaged and maintain proper seat height.", workoutType: "cardio", muscleGroups: ["quadriceps", "hamstrings", "calves", "glutes"], equipment: "stationary_bike", difficulty: "beginner" },
  { name: "Rowing Machine", description: "Full body cardiovascular exercise.", instructions: "Drive with legs first, then lean back slightly, then pull handle to lower chest. Reverse the sequence to return.", workoutType: "cardio", muscleGroups: ["back", "legs", "arms", "core"], equipment: "rowing_machine", difficulty: "beginner" },
  { name: "Jump Rope", description: "High-intensity cardiovascular exercise with a rope.", instructions: "Jump with both feet, turning rope with wrists. Keep jumps small and land on balls of feet.", workoutType: "cardio", muscleGroups: ["calves", "shoulders", "core"], equipment: "jump_rope", difficulty: "beginner" },
  { name: "Stair Climber", description: "Machine-based cardiovascular exercise simulating stair climbing.", instructions: "Step at a steady pace, keeping upright posture. Avoid leaning heavily on handrails.", workoutType: "cardio", muscleGroups: ["quadriceps", "glutes", "calves"], equipment: "stair_climber", difficulty: "beginner" },
  { name: "Swimming", description: "Full body low-impact cardiovascular exercise.", instructions: "Swim laps using preferred stroke at moderate intensity. Focus on breathing rhythm and form.", workoutType: "cardio", muscleGroups: ["full_body"], equipment: "pool", difficulty: "intermediate" },

  // === HIIT ===
  { name: "Mountain Climbers", description: "High-intensity core and cardio exercise.", instructions: "Start in plank position. Rapidly alternate driving knees toward chest, maintaining plank form throughout.", workoutType: "hiit", muscleGroups: ["core", "shoulders", "quadriceps"], equipment: "none", difficulty: "beginner" },
  { name: "High Knees", description: "Running in place with exaggerated knee lift.", instructions: "Run in place, driving knees as high as possible. Pump arms and maintain fast pace.", workoutType: "hiit", muscleGroups: ["quadriceps", "core", "calves"], equipment: "none", difficulty: "beginner" },
  { name: "Battle Ropes", description: "High-intensity upper body and cardio exercise.", instructions: "Hold rope ends, create alternating waves by rapidly raising and lowering arms. Keep core engaged.", workoutType: "hiit", muscleGroups: ["shoulders", "arms", "core"], equipment: "battle_ropes", difficulty: "intermediate" },
  { name: "Kettlebell Swings", description: "Explosive hip hinge movement with kettlebell.", instructions: "Hinge at hips, swing kettlebell between legs, then drive hips forward to swing bell to chest height.", workoutType: "hiit", muscleGroups: ["glutes", "hamstrings", "core", "shoulders"], equipment: "kettlebell", difficulty: "intermediate" },
  { name: "Sprint Intervals", description: "Alternating between maximum effort sprints and rest.", instructions: "Sprint at maximum effort for 20-30 seconds, then walk or rest for 60-90 seconds. Repeat.", workoutType: "hiit", muscleGroups: ["quadriceps", "hamstrings", "calves", "core"], equipment: "none", difficulty: "intermediate" },
  { name: "Tabata Squats", description: "Bodyweight squats performed in Tabata protocol.", instructions: "Perform squats for 20 seconds at maximum intensity, rest 10 seconds. Repeat for 8 rounds.", workoutType: "hiit", muscleGroups: ["quadriceps", "glutes"], equipment: "none", difficulty: "intermediate" },
  { name: "Sled Push", description: "Full body pushing exercise with weighted sled.", instructions: "Grip sled handles, lean forward and drive through legs to push sled across the floor.", workoutType: "hiit", muscleGroups: ["quadriceps", "glutes", "shoulders", "core"], equipment: "sled", difficulty: "intermediate" },

  // === YOGA ===
  { name: "Sun Salutation", description: "Flowing sequence of yoga poses linking breath with movement.", instructions: "Flow through mountain pose, forward fold, half lift, plank, chaturanga, upward dog, downward dog. Repeat.", workoutType: "yoga", muscleGroups: ["full_body"], equipment: "yoga_mat", difficulty: "beginner" },
  { name: "Warrior I", description: "Standing yoga pose building strength and stability.", instructions: "Step one foot back, bend front knee to 90 degrees, raise arms overhead. Square hips forward.", workoutType: "yoga", muscleGroups: ["quadriceps", "shoulders", "core"], equipment: "yoga_mat", difficulty: "beginner" },
  { name: "Warrior II", description: "Standing pose opening hips and building leg strength.", instructions: "Wide stance, front knee bent, arms extended parallel to floor. Gaze over front hand.", workoutType: "yoga", muscleGroups: ["quadriceps", "shoulders", "hips"], equipment: "yoga_mat", difficulty: "beginner" },
  { name: "Downward Dog", description: "Inverted V-shape pose stretching entire posterior chain.", instructions: "Hands and feet on floor, push hips up and back forming inverted V. Press heels toward floor.", workoutType: "yoga", muscleGroups: ["hamstrings", "calves", "shoulders", "back"], equipment: "yoga_mat", difficulty: "beginner" },
  { name: "Tree Pose", description: "Single-leg balance pose improving stability.", instructions: "Stand on one leg, place other foot on inner thigh or calf. Bring hands to prayer or overhead.", workoutType: "yoga", muscleGroups: ["core", "quadriceps", "calves"], equipment: "yoga_mat", difficulty: "beginner" },
  { name: "Pigeon Pose", description: "Deep hip opener targeting hip flexors and glutes.", instructions: "From downward dog, bring one knee forward behind wrist. Extend back leg. Fold forward over front leg.", workoutType: "yoga", muscleGroups: ["hips", "glutes"], equipment: "yoga_mat", difficulty: "intermediate" },
  { name: "Crow Pose", description: "Arm balance requiring core and upper body strength.", instructions: "Squat with hands on floor, place knees on backs of upper arms. Lean forward, lifting feet off floor.", workoutType: "yoga", muscleGroups: ["core", "shoulders", "arms"], equipment: "yoga_mat", difficulty: "advanced" },

  // === STRETCHING ===
  { name: "Hamstring Stretch", description: "Static stretch for hamstring flexibility.", instructions: "Sit with one leg extended, reach toward toes keeping back straight. Hold for 30 seconds each side.", workoutType: "stretching", muscleGroups: ["hamstrings"], equipment: "none", difficulty: "beginner" },
  { name: "Quad Stretch", description: "Standing stretch for quadriceps.", instructions: "Stand on one leg, pull other foot toward glutes. Keep knees together and hips square.", workoutType: "stretching", muscleGroups: ["quadriceps"], equipment: "none", difficulty: "beginner" },
  { name: "Hip Flexor Stretch", description: "Lunge-based stretch for hip flexors.", instructions: "Kneel in lunge position, push hips forward while keeping torso upright. Hold 30 seconds each side.", workoutType: "stretching", muscleGroups: ["hip_flexors"], equipment: "none", difficulty: "beginner" },
  { name: "Chest Stretch", description: "Doorway or wall stretch for pectoral muscles.", instructions: "Place forearm on doorframe at 90 degrees, step through until chest stretch is felt. Hold.", workoutType: "stretching", muscleGroups: ["chest"], equipment: "none", difficulty: "beginner" },
  { name: "Cat-Cow Stretch", description: "Spinal mobility exercise alternating flexion and extension.", instructions: "On hands and knees, alternate between arching back (cow) and rounding back (cat) with breath.", workoutType: "stretching", muscleGroups: ["back", "core"], equipment: "none", difficulty: "beginner" },
  { name: "Shoulder Cross-Body Stretch", description: "Stretch for posterior shoulder.", instructions: "Pull one arm across body at shoulder height with opposite hand. Hold for 30 seconds each side.", workoutType: "stretching", muscleGroups: ["shoulders"], equipment: "none", difficulty: "beginner" },

  // === CALISTHENICS / BODYWEIGHT ===
  { name: "Push-Ups", description: "Fundamental upper body bodyweight exercise.", instructions: "Start in plank, lower chest to floor by bending elbows, push back up. Keep body in straight line.", workoutType: "calisthenics", muscleGroups: ["chest", "triceps", "shoulders", "core"], equipment: "none", difficulty: "beginner" },
  { name: "Pull-Ups", description: "Upper body pulling exercise using a bar.", instructions: "Hang from bar with overhand grip, pull body up until chin clears bar. Lower with control.", workoutType: "calisthenics", muscleGroups: ["back", "biceps", "core"], equipment: "pull_up_bar", difficulty: "intermediate" },
  { name: "Chin-Ups", description: "Pull-up variation with underhand grip emphasizing biceps.", instructions: "Hang from bar with underhand grip, pull up until chin clears bar. Lower with control.", workoutType: "calisthenics", muscleGroups: ["biceps", "back", "core"], equipment: "pull_up_bar", difficulty: "intermediate" },
  { name: "Bodyweight Squats", description: "Fundamental lower body bodyweight exercise.", instructions: "Stand with feet shoulder-width, lower by bending knees and hips until thighs are parallel. Stand back up.", workoutType: "calisthenics", muscleGroups: ["quadriceps", "glutes", "hamstrings"], equipment: "none", difficulty: "beginner" },
  { name: "Plank", description: "Isometric core stability exercise.", instructions: "Hold push-up position on forearms, body in straight line from head to heels. Engage core throughout.", workoutType: "calisthenics", muscleGroups: ["core", "shoulders"], equipment: "none", difficulty: "beginner" },
  { name: "Lunges", description: "Unilateral lower body exercise.", instructions: "Step forward, lower back knee toward floor until both knees at 90 degrees. Push back to start.", workoutType: "calisthenics", muscleGroups: ["quadriceps", "glutes", "hamstrings"], equipment: "none", difficulty: "beginner" },
  { name: "Dips (Bodyweight)", description: "Upper body pushing exercise on parallel bars.", instructions: "Support yourself on bars, lower body by bending elbows to 90 degrees, press back up.", workoutType: "calisthenics", muscleGroups: ["triceps", "chest", "shoulders"], equipment: "dip_station", difficulty: "intermediate" },
  { name: "Pistol Squats", description: "Single-leg squat requiring strength and balance.", instructions: "Stand on one leg, extend other leg forward. Squat down on standing leg, then stand back up.", workoutType: "calisthenics", muscleGroups: ["quadriceps", "glutes", "core"], equipment: "none", difficulty: "advanced" },
  { name: "Muscle-Ups", description: "Advanced bar exercise combining pull-up and dip.", instructions: "Perform explosive pull-up, transition over bar, then press up to support position.", workoutType: "calisthenics", muscleGroups: ["back", "chest", "triceps", "core"], equipment: "pull_up_bar", difficulty: "advanced" },
  { name: "Handstand Push-Ups", description: "Inverted pressing exercise against a wall.", instructions: "Kick up to handstand against wall, lower head toward floor by bending elbows, press back up.", workoutType: "calisthenics", muscleGroups: ["shoulders", "triceps", "core"], equipment: "none", difficulty: "advanced" },
  { name: "L-Sit", description: "Isometric hold requiring core and hip flexor strength.", instructions: "Support yourself on parallel bars or floor, lift legs to form L-shape. Hold position.", workoutType: "calisthenics", muscleGroups: ["core", "hip_flexors", "triceps"], equipment: "none", difficulty: "advanced" },
  { name: "Inverted Rows", description: "Bodyweight rowing using a low bar or TRX.", instructions: "Hang under a bar with feet on floor, pull chest to bar squeezing shoulder blades. Lower with control.", workoutType: "calisthenics", muscleGroups: ["back", "biceps", "core"], equipment: "pull_up_bar", difficulty: "beginner" },

  // === CROSSFIT ===
  { name: "Clean and Jerk", description: "Olympic lift combining a clean with overhead jerk.", instructions: "Pull barbell from floor to shoulders (clean), then drive overhead with split or push jerk.", workoutType: "crossfit", muscleGroups: ["full_body"], equipment: "barbell", difficulty: "advanced" },
  { name: "Snatch", description: "Olympic lift bringing barbell from floor to overhead in one motion.", instructions: "Wide grip, pull barbell from floor overhead in one fluid motion, catching in overhead squat.", workoutType: "crossfit", muscleGroups: ["full_body"], equipment: "barbell", difficulty: "advanced" },
  { name: "Thrusters", description: "Front squat to overhead press combination.", instructions: "Hold barbell at shoulders, squat down, then drive up pressing bar overhead in one fluid motion.", workoutType: "crossfit", muscleGroups: ["quadriceps", "shoulders", "core"], equipment: "barbell", difficulty: "intermediate" },
  { name: "Wall Balls", description: "Squat and throw medicine ball to target.", instructions: "Hold medicine ball at chest, squat, then explosively stand and throw ball to target on wall.", workoutType: "crossfit", muscleGroups: ["quadriceps", "shoulders", "core"], equipment: "medicine_ball", difficulty: "intermediate" },
  { name: "Double Unders", description: "Jump rope passing under feet twice per jump.", instructions: "Jump higher than normal, spin rope fast enough to pass under feet twice before landing.", workoutType: "crossfit", muscleGroups: ["calves", "shoulders", "core"], equipment: "jump_rope", difficulty: "intermediate" },
  { name: "Kipping Pull-Ups", description: "Momentum-assisted pull-ups used in CrossFit.", instructions: "Swing body in an arc on the bar, use hip drive to pull chin over bar efficiently.", workoutType: "crossfit", muscleGroups: ["back", "shoulders", "core"], equipment: "pull_up_bar", difficulty: "intermediate" },
  { name: "Box Step-Ups", description: "Step onto a box alternating legs.", instructions: "Step onto box with one foot, drive up to standing on box. Step down and alternate legs.", workoutType: "crossfit", muscleGroups: ["quadriceps", "glutes"], equipment: "plyo_box", difficulty: "beginner" },
  { name: "Rope Climbs", description: "Climbing a vertical rope using arms and legs.", instructions: "Grip rope, use foot lock technique, pull body upward hand over hand to top.", workoutType: "crossfit", muscleGroups: ["back", "biceps", "grip", "core"], equipment: "climbing_rope", difficulty: "advanced" },

  // === SPORT SPECIFIC ===
  { name: "Agility Ladder Drills", description: "Footwork drills using an agility ladder.", instructions: "Perform various foot patterns through ladder: in-in-out-out, lateral shuffles, crossovers.", workoutType: "sport_specific", muscleGroups: ["calves", "quadriceps", "core"], equipment: "agility_ladder", difficulty: "beginner" },
  { name: "Cone Drills", description: "Speed and agility drills around cones.", instructions: "Set up cones in various patterns. Sprint, cut, and change direction around cones at maximum speed.", workoutType: "sport_specific", muscleGroups: ["quadriceps", "calves", "core"], equipment: "cones", difficulty: "beginner" },
  { name: "Medicine Ball Slams", description: "Explosive overhead slam with medicine ball.", instructions: "Lift medicine ball overhead, slam it into ground with full force. Pick up and repeat.", workoutType: "sport_specific", muscleGroups: ["core", "shoulders", "back"], equipment: "medicine_ball", difficulty: "intermediate" },
  { name: "Farmer's Walk", description: "Loaded carry exercise for grip and full body conditioning.", instructions: "Hold heavy weights at sides, walk with upright posture for distance or time.", workoutType: "sport_specific", muscleGroups: ["grip", "traps", "core", "legs"], equipment: "dumbbells", difficulty: "beginner" },
  { name: "Sled Pull", description: "Pulling a weighted sled for conditioning.", instructions: "Attach harness or rope to sled, pull sled toward you hand over hand or walk backward.", workoutType: "sport_specific", muscleGroups: ["back", "biceps", "legs", "core"], equipment: "sled", difficulty: "intermediate" },
  { name: "Resistance Band Sprints", description: "Resisted sprinting for speed development.", instructions: "Attach resistance band to waist, sprint forward against band resistance for 10-20 meters.", workoutType: "sport_specific", muscleGroups: ["quadriceps", "glutes", "hamstrings"], equipment: "resistance_bands", difficulty: "intermediate" },

  // === BODYWEIGHT (additional) ===
  { name: "Glute Bridges", description: "Hip extension exercise targeting glutes.", instructions: "Lie on back, feet flat on floor. Drive hips up squeezing glutes at top. Lower with control.", workoutType: "bodyweight", muscleGroups: ["glutes", "hamstrings"], equipment: "none", difficulty: "beginner" },
  { name: "Side Plank", description: "Lateral core stability exercise.", instructions: "Lie on side, prop up on forearm. Lift hips creating straight line from head to feet. Hold.", workoutType: "bodyweight", muscleGroups: ["obliques", "core"], equipment: "none", difficulty: "beginner" },
  { name: "Bicycle Crunches", description: "Dynamic core exercise targeting obliques.", instructions: "Lie on back, alternate bringing opposite elbow to knee while extending other leg.", workoutType: "bodyweight", muscleGroups: ["core", "obliques"], equipment: "none", difficulty: "beginner" },
  { name: "Superman Hold", description: "Prone back extension exercise.", instructions: "Lie face down, simultaneously lift arms and legs off floor. Hold briefly, lower with control.", workoutType: "bodyweight", muscleGroups: ["back", "glutes"], equipment: "none", difficulty: "beginner" },
  { name: "Wall Sit", description: "Isometric lower body hold against a wall.", instructions: "Lean against wall, slide down until thighs are parallel to floor. Hold position.", workoutType: "bodyweight", muscleGroups: ["quadriceps", "glutes"], equipment: "none", difficulty: "beginner" },
  { name: "Bear Crawl", description: "Quadruped movement pattern for full body conditioning.", instructions: "On hands and feet with knees hovering, crawl forward keeping back flat and hips low.", workoutType: "bodyweight", muscleGroups: ["shoulders", "core", "quadriceps"], equipment: "none", difficulty: "intermediate" },
  { name: "Calf Raises", description: "Standing exercise for calf development.", instructions: "Stand on edge of step, raise up on toes as high as possible, lower heels below step level.", workoutType: "bodyweight", muscleGroups: ["calves"], equipment: "none", difficulty: "beginner" },
  { name: "Diamond Push-Ups", description: "Close-grip push-up variation targeting triceps.", instructions: "Place hands together forming diamond shape under chest. Perform push-up keeping elbows close to body.", workoutType: "bodyweight", muscleGroups: ["triceps", "chest"], equipment: "none", difficulty: "intermediate" },
  { name: "Flutter Kicks", description: "Core exercise with alternating leg movements.", instructions: "Lie on back, lift legs slightly off floor. Alternate kicking legs up and down in small range.", workoutType: "bodyweight", muscleGroups: ["core", "hip_flexors"], equipment: "none", difficulty: "beginner" },
  { name: "Burpee Broad Jumps", description: "Burpee variation with forward broad jump.", instructions: "Perform a burpee, then instead of jumping up, perform a broad jump forward.", workoutType: "bodyweight", muscleGroups: ["full_body"], equipment: "none", difficulty: "advanced" },
];

async function seed() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  const missingCoverage = exercises
    .filter((exercise) => getCuratedImageUrls(exercise.workoutType).length === 0)
    .map((exercise) => `${exercise.name} (${exercise.workoutType})`);

  if (missingCoverage.length > 0) {
    throw new Error(`Missing curated images for exercises: ${missingCoverage.join(", ")}`);
  }

  // Check if exercises already exist
  const [rows] = await conn.execute("SELECT COUNT(*) as cnt FROM exercises");
  if (rows[0].cnt > 0) {
    console.log(`Exercises table already has ${rows[0].cnt} rows, skipping seed.`);
    await conn.end();
    return;
  }

  for (const ex of exercises) {
    const imageUrls = getCuratedImageUrls(ex.workoutType);
    await conn.execute(
      `INSERT INTO exercises (name, description, instructions, workoutType, muscleGroups, equipment, difficulty, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ex.name, ex.description, ex.instructions, ex.workoutType, JSON.stringify(ex.muscleGroups), ex.equipment, ex.difficulty, imageUrls[0] ?? null]
    );
  }

  console.log(`Seeded ${exercises.length} exercises successfully.`);
  await conn.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
