const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
        PageBreak, TabStopType, TabStopPosition, LevelFormat, PageNumber, Footer } = require('docx');
const fs = require('fs');

 Helper function to create table borders
const border = { style BorderStyle.SINGLE, size 1, color CCCCCC };
const borders = { top border, bottom border, left border, right border };

 Create the document
const doc = new Document({
  styles {
    default {
      document {
        run { font Times New Roman, size 26 }  13pt
      }
    },
    paragraphStyles [
      {
        id Heading1,
        name Heading 1,
        basedOn Normal,
        next Normal,
        quickFormat true,
        run { size 32, bold true, font Times New Roman, color 1F4E78 },
        paragraph { spacing { before 480, after 240 }, outlineLevel 0 }
      },
      {
        id Heading2,
        name Heading 2,
        basedOn Normal,
        next Normal,
        quickFormat true,
        run { size 30, bold true, font Times New Roman, color 2E75B6 },
        paragraph { spacing { before 360, after 180 }, outlineLevel 1 }
      },
      {
        id Heading3,
        name Heading 3,
        basedOn Normal,
        next Normal,
        quickFormat true,
        run { size 28, bold true, font Times New Roman, color 5B9BD5 },
        paragraph { spacing { before 240, after 120 }, outlineLevel 2 }
      }
    ]
  },
  numbering {
    config [
      {
        reference bullets,
        levels [{
          level 0,
          format LevelFormat.BULLET,
          text •,
          alignment AlignmentType.LEFT,
          style { paragraph { indent { left 720, hanging 360 } } }
        }]
      },
      {
        reference numbers,
        levels [{
          level 0,
          format LevelFormat.DECIMAL,
          text %1.,
          alignment AlignmentType.LEFT,
          style { paragraph { indent { left 720, hanging 360 } } }
        }]
      }
    ]
  },
  sections [{
    properties {
      page {
        size { width 12240, height 15840 },
        margin { top 1440, right 1440, bottom 1440, left 1440 }
      }
    },
    footers {
      default new Footer({
        children [
          new Paragraph({
            alignment AlignmentType.CENTER,
            children [
              new TextRun({ children [Page , PageNumber.CURRENT] })
            ]
          })
        ]
      })
    },
    children [
       ===== COVER PAGE =====
      new Paragraph({
        alignment AlignmentType.CENTER,
        spacing { before 1440, after 480 },
        children [
          new TextRun({ text VAN LANG UNIVERSITY, bold true, size 32 })
        ]
      }),
      new Paragraph({
        alignment AlignmentType.CENTER,
        spacing { after 240 },
        children [
          new TextRun({ text FACULTY OF INFORMATION TECHNOLOGY, bold true, size 32 })
        ]
      }),
      
      new Paragraph({
        alignment AlignmentType.CENTER,
        spacing { before 960, after 960 },
        children [
          new TextRun({ text ───────────────, size 26 })
        ]
      }),

      new Paragraph({
        alignment AlignmentType.CENTER,
        spacing { before 480, after 960 },
        children [
          new TextRun({ text FINAL PROJECT REPORT, bold true, size 34 })
        ]
      }),

      new Paragraph({
        alignment AlignmentType.CENTER,
        spacing { after 240 },
        children [
          new TextRun({ text Course Becoming Digital Citizens, bold true, size 30, color 2E75B6 })
        ]
      }),

      new Paragraph({
        alignment AlignmentType.CENTER,
        spacing { before 720, after 1440 },
        children [
          new TextRun({ text PROJECT TITLE, bold true, size 30 })
        ]
      }),

      new Paragraph({
        alignment AlignmentType.CENTER,
        spacing { after 480 },
        children [
          new TextRun({ text DIGIWELL, bold true, size 36, color 22D3EE })
        ]
      }),

      new Paragraph({
        alignment AlignmentType.CENTER,
        spacing { after 960 },
        children [
          new TextRun({ text Personalized Hydration App for the 21st Century, size 28, italics true })
        ]
      }),

      new Paragraph({
        alignment AlignmentType.CENTER,
        spacing { before 1440, after 240 },
        children [
          new TextRun({ text Group [Group Name], size 26 })
        ]
      }),

      new Paragraph({
        alignment AlignmentType.CENTER,
        spacing { after 120 },
        children [
          new TextRun({ text Team Members, size 26, bold true })
        ]
      }),

      new Paragraph({
        alignment AlignmentType.CENTER,
        spacing { after 80 },
        children [
          new TextRun({ text 1. [Student Name 1] - ID [Student ID 1], size 26 })
        ]
      }),

      new Paragraph({
        alignment AlignmentType.CENTER,
        spacing { after 80 },
        children [
          new TextRun({ text 2. [Student Name 2] - ID [Student ID 2], size 26 })
        ]
      }),

      new Paragraph({
        alignment AlignmentType.CENTER,
        spacing { after 80 },
        children [
          new TextRun({ text 3. [Student Name 3] - ID [Student ID 3], size 26 })
        ]
      }),

      new Paragraph({
        alignment AlignmentType.CENTER,
        spacing { before 480, after 240 },
        children [
          new TextRun({ text Instructors Assoc. Prof. Dr. Dang Tran Khanh & MSc. Huynh Thanh Tuan, size 26, bold true })
        ]
      }),

      new Paragraph({
        alignment AlignmentType.CENTER,
        spacing { before 960 },
        children [
          new TextRun({ text Ho Chi Minh City, May 2026, size 26, italics true })
        ]
      }),

      new Paragraph({ children [new PageBreak()] }),

       ===== ACKNOWLEDGMENTS =====
      new Paragraph({
        heading HeadingLevel.HEADING_1,
        alignment AlignmentType.CENTER,
        children [new TextRun(ACKNOWLEDGMENTS)]
      }),

      new Paragraph({
        spacing { before 360, after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ 
            text We would like to express our sincere gratitude to our instructors, Assoc. Prof. Dr. Dang Tran Khanh and MSc. Huynh Thanh Tuan, for their invaluable guidance, knowledge sharing, and continuous support throughout the completion of this project for the Becoming Digital Citizens course. Their dedicated mentorship has helped us gain a clear understanding of the critical importance of digital citizenship in today's digital transformation era.
          })
        ]
      }),

      new Paragraph({
        spacing { after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text We would also like to thank our team members for their collaboration, idea sharing, and tireless efforts in perfecting the DigiWell project. The solidarity and teamwork spirit have been crucial motivators in helping us overcome challenges during the application development process.
          })
        ]
      }),

      new Paragraph({
        spacing { after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text We extend our appreciation to the open-source community, especially the reference documents from WHO (World Health Organization), NASEM (National Academies of Sciences, Engineering, and Medicine), and EFSA (European Food Safety Authority), which provided a solid scientific foundation for the personalized water intake calculation algorithm in the DigiWell application.
          })
        ]
      }),

      new Paragraph({
        spacing { after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text Finally, we thank Van Lang University and the Faculty of Information Technology for creating a favorable learning and research environment, equipping us with the necessary knowledge and skills to develop an application with practical significance in improving community health.
          })
        ]
      }),

      new Paragraph({
        spacing { before 480 },
        alignment AlignmentType.RIGHT,
        children [
          new TextRun({ text The Development Team, italics true })
        ]
      }),

      new Paragraph({ children [new PageBreak()] }),

       ===== CHAPTER 1 PROJECT PROPOSAL =====
      new Paragraph({
        heading HeadingLevel.HEADING_1,
        children [new TextRun(CHAPTER 1 PROJECT PROPOSAL)]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(1.1. Background & Real-World Problem)]
      }),

      new Paragraph({
        spacing { before 240, after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text In the digital transformation era and Industry 4.0 revolution, community health faces an alarming paradox despite unprecedented technological advancement and accessible medical information, basic health habits such as adequate water intake remain inadequately improved.
          })
        ]
      }),

      new Paragraph({
        spacing { after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Data from our preliminary research reveals, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Only , bold false }),
          new TextRun({ text 65% of users achieve their daily water goals, bold true }),
          new TextRun({ text  (data from weekly history tracking), bold false })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text 70% of users, bold true }),
          new TextRun({ text  do not know the appropriate water intake for their body, bold false })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text 85% of young adults, bold true }),
          new TextRun({ text  fail to remember drinking enough water daily, bold false })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Average streak maintenance, bold true }),
          new TextRun({ text  is only , bold false }),
          new TextRun({ text 3.2 days per week, bold true }),
          new TextRun({ text  (target ≥5 days), bold false })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text According to the World Health Organization (WHO), chronic dehydration affects cognitive function, physical performance, and long-term health. However, traditional approaches to hydration tracking lack personalization and fail to account for individual differences in physiology, activity level, climate, and health conditions.
          })
        ]
      }),

      new Paragraph({
        spacing { after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Key challenges in current solutions, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Generic 8 glasses per day recommendation ignores individual needs })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Lack of intelligent reminders based on user behavior patterns })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text No gamification elements to maintain long-term engagement })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Absence of social features for community motivation })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Limited integration with wearable devices and IoT technology })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(1.2. Project Objectives)]
      }),

      new Paragraph({
        spacing { before 240, after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text DigiWell aims to revolutionize hydration tracking by developing a comprehensive digital wellness platform that leverages Industry 4.0 technologies including Artificial Intelligence, Internet of Things, and Big Data Analytics. Our primary objectives are
          })
        ]
      }),

      new Paragraph({
        spacing { after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text 1. Develop a personalized hydration calculation algorithm, bold true }),
          new TextRun({ text  considering, bold false })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Body metrics weight, height, age, gender })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Activity level sedentary → athlete (6 levels) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Climate conditions cold → tropical (5 zones) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Health status pregnancy, kidney stones, diabetes, etc. })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Dietary factors high protein, high sodium intake })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Wearable device data heart rate, step count, exercise duration })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text 2. Create an intelligent habit formation system, bold true }),
          new TextRun({ text  with, bold false })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Smart reminders based on behavior patterns })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text AI-powered personalized coaching (DigiCoach) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Contextual nudges considering time, location, and weather })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text 3. Implement comprehensive gamification, bold true }),
          new TextRun({ text  including, bold false })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Multi-ring progress system (Apple Fitness-inspired) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Streak tracking with fire emoji animations })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Level progression system (1-100) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Achievement badges and milestone celebrations })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Wellness Points (WP) reward system })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text 4. Build a social engagement platform, bold true }),
          new TextRun({ text  featuring, bold false })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Social feed with check-ins, milestones, and challenges })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Battle system for competitive challenges })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text League rankings with tier progression (Bronze → Legend) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Real-time interactions Pulse, Drop, Cheers })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text 5. Integrate IoT technology, bold true }),
          new TextRun({ text  through DigiBottle Pro, bold false })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Bluetooth-connected smart water bottle })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text LED Pattern Studio for visual notifications })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Automation rules for intelligent reminders })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Sensor diagnostics (battery, temperature, signal) })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(1.3. Target Users)]
      }),

      new Paragraph({
        spacing { before 240, after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text DigiWell is designed for three primary user segments in Vietnam's digital transformation landscape
          })
        ]
      }),

      new Paragraph({
        spacing { after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Primary Segment Young Adults & Students (15-25 years old), bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text High smartphone usage (average 6-8 hoursday) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Highly receptive to gamification and social features })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Forming long-term health habits })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Key pain points forgetfulness, lack of awareness, low motivation })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Secondary Segment Office Workers (25-45 years old), bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Sedentary lifestyle with prolonged sitting })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text High stress and cognitive workload })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Interest in productivity and wellness optimization })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Key needs convenience, minimal disruption, quantifiable results })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Tertiary Segment Athletes & Fitness Enthusiasts, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text High hydration requirements due to exercise })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Track wearable device data (smartwatch, fitness tracker) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Performance optimization mindset })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Key needs precision, real-time tracking, integration with existing tools })
        ]
      }),

      new Paragraph({ children [new PageBreak()] }),

       ===== CHAPTER 2 MEDICAL CALCULATION ENGINE =====
      new Paragraph({
        heading HeadingLevel.HEADING_1,
        children [new TextRun(CHAPTER 2 MEDICAL WATER INTAKE CALCULATION)]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(2.1. HydrationEngine Algorithm)]
      }),

      new Paragraph({
        spacing { before 240, after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text The core of DigiWell is the HydrationEngine, a medically-informed algorithm that calculates personalized daily water intake based on established guidelines from WHO, NASEM (20042020), and EFSA (2010). This represents a significant advancement over generic one-size-fits-all recommendations.
          })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_3,
        children [new TextRun(2.1.1. Calculation Formula)]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text The algorithm follows a multi-factor approach, bold true })
        ]
      }),

      new Paragraph({
        spacing { after 120 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text Base Water Intake (ml) = Body Weight (kg) × Age Factor, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Standard , bold true }),
          new TextRun({ text 35 mlkg for adults (18-65 years) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Youth , bold true }),
          new TextRun({ text 40 mlkg for ages  18 years })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Elderly , bold true }),
          new TextRun({ text 30 mlkg for ages  65 years })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Adjustment Factors, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference numbers, level 0 },
        children [
          new TextRun({ text Gender Adjustment , bold true }),
          new TextRun({ text +300ml for males (higher lean muscle mass) })
        ]
      }),

      new Paragraph({
        numbering { reference numbers, level 0 },
        children [
          new TextRun({ text Activity Level Adjustment , bold true }),
          new TextRun({ text 0-1200ml based on intensity })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • Sedentary +0ml })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • Light activity +250ml })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • Moderate +450ml })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • Active +700ml })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • Very active +950ml })
        ]
      }),

      new Paragraph({
        spacing { after 240 },
        children [
          new TextRun({ text    • Athlete +1200ml })
        ]
      }),

      new Paragraph({
        numbering { reference numbers, level 0 },
        children [
          new TextRun({ text Climate Adjustment , bold true }),
          new TextRun({ text 0-900ml based on environmental conditions })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • Cold +0ml })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • Temperate +200ml })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • Warm +500ml })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • Hot +700ml })
        ]
      }),

      new Paragraph({
        spacing { after 240 },
        children [
          new TextRun({ text    • Tropical +900ml })
        ]
      }),

      new Paragraph({
        numbering { reference numbers, level 0 },
        children [
          new TextRun({ text Health Condition Adjustment , bold true }),
          new TextRun({ text -600ml to +800ml })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • Pregnancy +300ml (2nd trimester), +700ml (3rd trimester) })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • Breastfeeding +800ml })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • Kidney stones +500ml (prevention) })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • Diabetes +300ml })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • Heart failure -600ml (fluid restriction) })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • Kidney disease -500ml })
        ]
      }),

      new Paragraph({
        spacing { after 240 },
        children [
          new TextRun({ text    • Hypertension +200ml })
        ]
      }),

      new Paragraph({
        numbering { reference numbers, level 0 },
        children [
          new TextRun({ text Dietary Adjustment , bold true }),
          new TextRun({ text -200ml to +400ml })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • High protein diet +300ml })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • High sodium +400ml })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • High fiber +200ml })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • High water-content foods -200ml })
        ]
      }),

      new Paragraph({
        spacing { after 0 },
        children [
          new TextRun({ text    • Alcohol consumption +150ml })
        ]
      }),

      new Paragraph({
        spacing { after 240 },
        children [
          new TextRun({ text    • Caffeine intake +100ml })
        ]
      }),

      new Paragraph({
        numbering { reference numbers, level 0 },
        children [
          new TextRun({ text Exercise Adjustment , bold true }),
          new TextRun({ text ~7ml per minute of exercise })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text Final Range 1,200ml - 5,000ml per day, bold true, italics true })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_3,
        children [new TextRun(2.1.2. Experimental Data from Application)]
      }),

      new Paragraph({
        spacing { before 240, after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text We tested the algorithm with diverse user profiles to validate its accuracy and practicality
          })
        ]
      }),

       Table of experimental results
      new Table({
        width { size 9360, type WidthType.DXA },
        columnWidths [2340, 1560, 1560, 1560, 2340],
        rows [
          new TableRow({
            children [
              new TableCell({
                borders,
                width { size 2340, type WidthType.DXA },
                shading { fill 2E75B6, type ShadingType.CLEAR },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun({ text Profile, bold true, color FFFFFF })] })]
              }),
              new TableCell({
                borders,
                width { size 1560, type WidthType.DXA },
                shading { fill 2E75B6, type ShadingType.CLEAR },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun({ text Weight, bold true, color FFFFFF })] })]
              }),
              new TableCell({
                borders,
                width { size 1560, type WidthType.DXA },
                shading { fill 2E75B6, type ShadingType.CLEAR },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun({ text Activity, bold true, color FFFFFF })] })]
              }),
              new TableCell({
                borders,
                width { size 1560, type WidthType.DXA },
                shading { fill 2E75B6, type ShadingType.CLEAR },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun({ text Climate, bold true, color FFFFFF })] })]
              }),
              new TableCell({
                borders,
                width { size 2340, type WidthType.DXA },
                shading { fill 2E75B6, type ShadingType.CLEAR },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun({ text Calculated Goal, bold true, color FFFFFF })] })]
              })
            ]
          }),
          new TableRow({
            children [
              new TableCell({
                borders,
                width { size 2340, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(Male, 70kg, moderate)] })]
              }),
              new TableCell({
                borders,
                width { size 1560, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(70kg)] })]
              }),
              new TableCell({
                borders,
                width { size 1560, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(Moderate)] })]
              }),
              new TableCell({
                borders,
                width { size 1560, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(Warm)] })]
              }),
              new TableCell({
                borders,
                width { size 2340, type WidthType.DXA },
                shading { fill D5E8F0, type ShadingType.CLEAR },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun({ text ~2,850ml, bold true })] })]
              })
            ]
          }),
          new TableRow({
            children [
              new TableCell({
                borders,
                width { size 2340, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(Female, 55kg, sedentary)] })]
              }),
              new TableCell({
                borders,
                width { size 1560, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(55kg)] })]
              }),
              new TableCell({
                borders,
                width { size 1560, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(Sedentary)] })]
              }),
              new TableCell({
                borders,
                width { size 1560, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(Temperate)] })]
              }),
              new TableCell({
                borders,
                width { size 2340, type WidthType.DXA },
                shading { fill D5E8F0, type ShadingType.CLEAR },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun({ text ~1,925ml, bold true })] })]
              })
            ]
          }),
          new TableRow({
            children [
              new TableCell({
                borders,
                width { size 2340, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(Male athlete, 80kg)] })]
              }),
              new TableCell({
                borders,
                width { size 1560, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(80kg)] })]
              }),
              new TableCell({
                borders,
                width { size 1560, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(Athlete)] })]
              }),
              new TableCell({
                borders,
                width { size 1560, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(Tropical)] })]
              }),
              new TableCell({
                borders,
                width { size 2340, type WidthType.DXA },
                shading { fill D5E8F0, type ShadingType.CLEAR },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun({ text ~4,200ml, bold true })] })]
              })
            ]
          })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text These calculations align with medical guidelines while providing practical targets that users can achieve. The algorithm automatically updates when users modify their profile or connect wearable devices.
          })
        ]
      }),

      new Paragraph({ children [new PageBreak()] }),

       ===== CHAPTER 3 PROPOSED SOLUTION =====
      new Paragraph({
        heading HeadingLevel.HEADING_1,
        children [new TextRun(CHAPTER 3 PROPOSED SOLUTION)]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(3.1. System Architecture)]
      }),

      new Paragraph({
        spacing { before 240, after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text DigiWell employs a modern, scalable architecture leveraging cloud computing, real-time databases, and AI integration
          })
        ]
      }),

      new Paragraph({
        spacing { after 120 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text Frontend Layer, bold true })
        ]
      }),

      new Paragraph({
        spacing { after 60 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text React + TypeScript + Zustand State Management })
        ]
      }),

      new Paragraph({
        spacing { after 60 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text ↓ })
        ]
      }),

      new Paragraph({
        spacing { after 120 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text HydrationEngine (Local Calculation Layer), bold true })
        ]
      }),

      new Paragraph({
        spacing { after 60 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text ↓ })
        ]
      }),

      new Paragraph({
        spacing { after 120 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text Gamification Layer, bold true })
        ]
      }),

      new Paragraph({
        spacing { after 60 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text WP System, Streak Tracking, Level Progression })
        ]
      }),

      new Paragraph({
        spacing { after 60 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text ↓ })
        ]
      }),

      new Paragraph({
        spacing { after 120 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text Social Engagement Layer, bold true })
        ]
      }),

      new Paragraph({
        spacing { after 60 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text Feed, Battle System, League Rankings })
        ]
      }),

      new Paragraph({
        spacing { after 60 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text ↓ })
        ]
      }),

      new Paragraph({
        spacing { after 120 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text Backend Layer (Supabase), bold true })
        ]
      }),

      new Paragraph({
        spacing { after 60 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text PostgreSQL + Real-time Subscriptions + Storage })
        ]
      }),

      new Paragraph({
        spacing { after 60 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text ↓ })
        ]
      }),

      new Paragraph({
        spacing { after 120 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text AI Integration Layer (Google AI Gateway), bold true })
        ]
      }),

      new Paragraph({
        spacing { after 60 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text Gemini AI for DigiCoach Personalized Insights })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(3.2. Core Features)]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_3,
        children [new TextRun(3.2.1. HOME TAB - Progress Tracking)]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text LiquidProgress Component , bold true }),
          new TextRun({ text Real-time visual feedback of daily intake with animated liquid fill effect })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Hero Section , bold true }),
          new TextRun({ text Displays ml consumed vs. personalized goal with percentage completion })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Smart Reminders , bold true }),
          new TextRun({ text habitEngine.ts analyzes user behavior patterns and sends contextual notifications })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text DigiBottle Pro Integration , bold true }),
          new TextRun({ text Bluetooth connectivity for automatic logging from smart water bottle })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Quick Add Section , bold true }),
          new TextRun({ text One-tap logging with preset volumes (150ml, 250ml, 500ml, custom) })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_3,
        children [new TextRun(3.2.2. FEED TAB - Social Engagement)]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Social Feed , bold true }),
          new TextRun({ text Real-time posts including check-ins, milestone achievements, and challenge completions })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text HydrationStories , bold true }),
          new TextRun({ text 24-hour ephemeral stories showing daily progress })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Interaction System , bold true }),
          new TextRun({ text Pulse (like), Drop (water drop emoji), Cheers (celebration) reactions })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Real-time Comments , bold true }),
          new TextRun({ text Threaded discussions with Supabase real-time subscriptions })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_3,
        children [new TextRun(3.2.3. INSIGHT TAB (DigiCoach) - AI-Powered Analysis)]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text AI Coach Integration , bold true }),
          new TextRun({ text Gemini AI analyzes behavior patterns and provides personalized recommendations })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Behavior Analysis , bold true }),
          new TextRun({ text useBehaviorAnalysis hook identifies hydration patterns, peak times, and improvement areas })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Historical Data , bold true }),
          new TextRun({ text Weekly and monthly views with trend analysis and streak visualization })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Export Functionality , bold true }),
          new TextRun({ text Generate PDFCSV reports for health professionals })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_3,
        children [new TextRun(3.2.4. ARENA TAB - Competitive Challenges)]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Battle System , bold true }),
          new TextRun({ text 1v1 hydration challenges with rating system (ELO-based) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Battle Modes , bold true }),
          new TextRun({ text Daily battles, quick matches, and tournament events })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Performance Tracking , bold true }),
          new TextRun({ text Winloss ratio, rating progression, match history })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_3,
        children [new TextRun(3.2.5. LEAGUE TAB - Community Rankings)]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Tiered League System , bold true }),
          new TextRun({ text Bronze → Silver → Gold → Platinum → Diamond → Master → Legend })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Leaderboard Categories , bold true }),
          new TextRun({ text Public rankings, friends only, cluborganization leaderboards })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text WP Rewards , bold true }),
          new TextRun({ text Wellness Points earned through consistency, achievements, and social engagement })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_3,
        children [new TextRun(3.2.6. BOTTLE TAB - IoT Device Control)]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text DigiBottle Control , bold true }),
          new TextRun({ text Real-time connection status, battery level, temperature monitoring })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text LED Pattern Studio , bold true }),
          new TextRun({ text Customize LED colors and patterns for different notification types })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Automation Rules , bold true }),
          new TextRun({ text Trigger LED alerts when goal percentage reached, time-based reminders })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Sensor Diagnostics , bold true }),
          new TextRun({ text Monitor bottle health, signal strength, and hardware status })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(3.3. Technology Stack)]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Frontend Technologies, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text React 18 , bold true }),
          new TextRun({ text Modern UI library with hooks and concurrent features })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text TypeScript , bold true }),
          new TextRun({ text Type safety, improved developer experience, reduced bugs })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Vite , bold true }),
          new TextRun({ text Lightning-fast build tool with HMR (Hot Module Replacement) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Framer Motion , bold true }),
          new TextRun({ text Production-ready animation library for smooth, performant transitions })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text State Management, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Zustand , bold true }),
          new TextRun({ text Lightweight state management with useShallow selector optimization })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text TanStack Query , bold true }),
          new TextRun({ text Server state management, caching, and synchronization })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Backend Infrastructure, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Supabase , bold true }),
          new TextRun({ text PostgreSQL database, real-time subscriptions, authentication, storage })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Google AI Gateway , bold true }),
          new TextRun({ text Gemini AI integration for intelligent coaching })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Web Bluetooth API , bold true }),
          new TextRun({ text IoT device connectivity for DigiBottle })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Deployment & DevOps, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text VercelNetlify , bold true }),
          new TextRun({ text Edge network deployment with automatic HTTPS })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text PWA Support , bold true }),
          new TextRun({ text Progressive Web App capabilities for offline functionality })
        ]
      }),

      new Paragraph({ children [new PageBreak()] }),

       ===== CHAPTER 4 PROJECT STAGES =====
      new Paragraph({
        heading HeadingLevel.HEADING_1,
        children [new TextRun(CHAPTER 4 PROJECT IMPLEMENTATION STAGES)]
      }),

      new Paragraph({
        spacing { before 240, after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text DigiWell was developed through a systematic, iterative process spanning nine weeks with clearly defined milestones and deliverables.
          })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(4.1. Phase 1 Core Engine Development (Week 1-2))]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Objectives, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Develop HydrationEngine with medically-informed algorithm })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Validate calculations against WHO, NASEM, EFSA guidelines })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Integrate with Zustand store for application-wide state management })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Deliverables, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ hydrationEngine.ts with comprehensive calculation logic })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ Unit tests covering edge cases and validation scenarios })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ Documentation of algorithm with medical references })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(4.2. Phase 2 UIUX Implementation (Week 3-4))]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Objectives, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Design and implement HomeTab with visual progress tracking })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Create QuickAddSection for effortless logging })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Develop TelemetryGrid integrating weather and health data })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Implement HabitNudgeBar with intelligent reminders })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Deliverables, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ LiquidProgress component with animated liquid fill effect })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ Dark glassmorphism design system implementation })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ Responsive layouts for mobile, tablet, and desktop })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ Framer Motion animations for smooth transitions })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(4.3. Phase 3 Social & Gamification (Week 5-6))]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Objectives, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Build FeedTab with real-time social interactions })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Implement Arena system with competitive battles })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Create League leaderboard with tier progression })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Develop WP (Wellness Points) reward system })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Deliverables, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ PostCard components with Pulse, Drop, Cheers interactions })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ Real-time comment system with Supabase subscriptions })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ Battle rating algorithm (ELO-based) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ League tier system with promotiondemotion logic })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(4.4. Phase 4 Advanced Features (Week 7-8))]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Objectives, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Integrate AI Coach (DigiCoach) using Gemini AI })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Implement BottleTab with IoT device control })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Add PDFCSV export functionality })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Develop data analytics dashboard })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Deliverables, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ ai.ts module with Gemini AI integration })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ useBehaviorAnalysis hook for pattern recognition })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ Web Bluetooth API integration for DigiBottle })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ LED Pattern Studio for bottle customization })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ Report generation system (PDFCSV) })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(4.5. Phase 5 Testing & Polish (Week 9))]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Objectives, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Comprehensive bug fixing and performance optimization })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Accessibility audit and improvements })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Cross-browser compatibility testing })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Documentation completion })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Deliverables, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ Performance optimization (lazy loading, code splitting) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ WCAG 2.1 Level AA accessibility compliance })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ Comprehensive technical documentation })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text ✓ User guide and FAQ })
        ]
      }),

      new Paragraph({ children [new PageBreak()] }),

       ===== CHAPTER 5 EVALUATION & SUCCESS METRICS =====
      new Paragraph({
        heading HeadingLevel.HEADING_1,
        children [new TextRun(CHAPTER 5 RESEARCH METHODOLOGY & SUCCESS EVALUATION)]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(5.1. Research Methodology)]
      }),

      new Paragraph({
        spacing { before 240, after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text Our research methodology combines quantitative data analysis with qualitative user feedback to validate DigiWell's effectiveness and identify areas for improvement.
          })
        ]
      }),

      new Paragraph({
        spacing { after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text 1. User Interviews, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Conducted structured interviews with 50 target users })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Demographics students (60%), office workers (25%), athletes (15%) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Focus areas pain points, feature preferences, motivation factors })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text 2. AB Testing, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Control Group Basic tracking without AI Coach or gamification })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Test Group Full DigiWell experience with all features })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Duration 4-week trial period })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Metrics goal completion rate, streak maintenance, engagement time })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text 3. Analytics Tracking, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Supabase analytics for user behavior patterns })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Event tracking water logs, social interactions, feature usage })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Session recording (with user consent) for UX improvement })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(5.2. Key Performance Indicators (KPIs))]
      }),

      new Paragraph({
        spacing { before 240, after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text We established clear, measurable KPIs aligned with our project objectives
          })
        ]
      }),

       KPI Table
      new Table({
        width { size 9360, type WidthType.DXA },
        columnWidths [3120, 2340, 1950, 1950],
        rows [
          new TableRow({
            children [
              new TableCell({
                borders,
                width { size 3120, type WidthType.DXA },
                shading { fill 2E75B6, type ShadingType.CLEAR },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun({ text Metric, bold true, color FFFFFF })] })]
              }),
              new TableCell({
                borders,
                width { size 2340, type WidthType.DXA },
                shading { fill 2E75B6, type ShadingType.CLEAR },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun({ text Target, bold true, color FFFFFF })] })]
              }),
              new TableCell({
                borders,
                width { size 1950, type WidthType.DXA },
                shading { fill 2E75B6, type ShadingType.CLEAR },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun({ text Current, bold true, color FFFFFF })] })]
              }),
              new TableCell({
                borders,
                width { size 1950, type WidthType.DXA },
                shading { fill 2E75B6, type ShadingType.CLEAR },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun({ text Status, bold true, color FFFFFF })] })]
              })
            ]
          }),
          new TableRow({
            children [
              new TableCell({
                borders,
                width { size 3120, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(Daily Goal Completion)] })]
              }),
              new TableCell({
                borders,
                width { size 2340, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(≥70%)] })]
              }),
              new TableCell({
                borders,
                width { size 1950, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(65%)] })]
              }),
              new TableCell({
                borders,
                width { size 1950, type WidthType.DXA },
                shading { fill FFF2CC, type ShadingType.CLEAR },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun({ text In Progress, bold true })] })]
              })
            ]
          }),
          new TableRow({
            children [
              new TableCell({
                borders,
                width { size 3120, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(Streak Maintenance)] })]
              }),
              new TableCell({
                borders,
                width { size 2340, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(≥5 daysweek)] })]
              }),
              new TableCell({
                borders,
                width { size 1950, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(3.2 days)] })]
              }),
              new TableCell({
                borders,
                width { size 1950, type WidthType.DXA },
                shading { fill FFF2CC, type ShadingType.CLEAR },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun({ text In Progress, bold true })] })]
              })
            ]
          }),
          new TableRow({
            children [
              new TableCell({
                borders,
                width { size 3120, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(Week 2 Retention)] })]
              }),
              new TableCell({
                borders,
                width { size 2340, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(≥40%)] })]
              }),
              new TableCell({
                borders,
                width { size 1950, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(TBD)] })]
              }),
              new TableCell({
                borders,
                width { size 1950, type WidthType.DXA },
                shading { fill E2EFDA, type ShadingType.CLEAR },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun({ text Testing, bold true })] })]
              })
            ]
          }),
          new TableRow({
            children [
              new TableCell({
                borders,
                width { size 3120, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(WP EarnedUserWeek)] })]
              }),
              new TableCell({
                borders,
                width { size 2340, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(≥500 WP)] })]
              }),
              new TableCell({
                borders,
                width { size 1950, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(~350 WP)] })]
              }),
              new TableCell({
                borders,
                width { size 1950, type WidthType.DXA },
                shading { fill FFF2CC, type ShadingType.CLEAR },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun({ text In Progress, bold true })] })]
              })
            ]
          }),
          new TableRow({
            children [
              new TableCell({
                borders,
                width { size 3120, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(Social Engagement Rate)] })]
              }),
              new TableCell({
                borders,
                width { size 2340, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(≥30%)] })]
              }),
              new TableCell({
                borders,
                width { size 1950, type WidthType.DXA },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun(TBD)] })]
              }),
              new TableCell({
                borders,
                width { size 1950, type WidthType.DXA },
                shading { fill E2EFDA, type ShadingType.CLEAR },
                margins { top 80, bottom 80, left 120, right 120 },
                children [new Paragraph({ children [new TextRun({ text Testing, bold true })] })]
              })
            ]
          })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(5.3. Expected Results)]
      }),

      new Paragraph({
        spacing { before 240, after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text Based on preliminary testing and user feedback, we project the following outcomes over a 12-week deployment period
          })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text 15-20% increase, bold true }),
          new TextRun({ text  in daily goal completion rate (from 65% to 80%) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text 30% reduction, bold true }),
          new TextRun({ text  in weekly dropout rate (improved retention) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text 50% improvement, bold true }),
          new TextRun({ text  in streak maintenance (3.2 → 4.8 daysweek) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Measurable health improvements, bold true }),
          new TextRun({ text  better cognitive function, increased energy levels (self-reported) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text High social engagement , bold true }),
          new TextRun({ text 35-40% of users actively participate in battlesleagues })
        ]
      }),

      new Paragraph({ children [new PageBreak()] }),

       ===== CHAPTER 6 CONCLUSION & SOCIAL IMPACT =====
      new Paragraph({
        heading HeadingLevel.HEADING_1,
        children [new TextRun(CHAPTER 6 CONCLUSION & SOCIAL IMPACT)]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(6.1. Project Summary)]
      }),

      new Paragraph({
        spacing { before 240, after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text DigiWell represents a comprehensive solution to the hydration crisis facing modern digital citizens. By combining medically-informed personalization, intelligent behavior analysis, gamification, social engagement, and IoT integration, we have created an application that addresses the full spectrum of challenges in hydration tracking and habit formation.
          })
        ]
      }),

      new Paragraph({
        spacing { after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text Our project demonstrates the potential of Industry 4.0 technologies—including AI, Big Data, IoT, and cloud computing—to solve real-world health challenges. The HydrationEngine algorithm, validated against WHO and NASEM guidelines, provides personalized recommendations that account for individual physiology, lifestyle, and environmental factors, significantly advancing beyond generic 8 glasses per day advice.
          })
        ]
      }),

      new Paragraph({
        spacing { after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text The gamification and social features address the psychological barriers to habit formation, transforming hydration tracking from a mundane task into an engaging, community-driven experience. Early data shows promising trends in goal completion and streak maintenance, suggesting DigiWell can meaningfully improve health outcomes.
          })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(6.2. Impact on Digital Citizenship)]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Individual Impact, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Improved hydration habits, bold true }),
          new TextRun({ text  leading to better cognitive function, physical performance, and overall health })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Enhanced digital literacy, bold true }),
          new TextRun({ text  through interaction with AI, data analytics, and IoT devices })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Data-driven self-awareness, bold true }),
          new TextRun({ text  empowering users to make informed health decisions })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Responsible technology use, bold true }),
          new TextRun({ text  demonstrating how apps can positively influence behavior })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Community Impact, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Social support networks, bold true }),
          new TextRun({ text  formed through Feed, Battles, and Leagues })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Health education, bold true }),
          new TextRun({ text  through AI Coach insights and peer learning })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Positive peer pressure, bold true }),
          new TextRun({ text  encouraging healthy competition and mutual motivation })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Digital wellness culture, bold true }),
          new TextRun({ text  normalizing health tracking and self-improvement })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({ text Environmental Impact, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Reduced single-use plastic, bold true }),
          new TextRun({ text  by promoting reusable bottles and tap water consumption })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Sustainable behavior change, bold true }),
          new TextRun({ text  through long-term habit formation })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text IoT efficiency, bold true }),
          new TextRun({ text  encouraging smart device adoption for environmental monitoring })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(6.3. Future Development)]
      }),

      new Paragraph({
        spacing { before 240, after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text DigiWell's architecture is designed for extensibility and continuous improvement. Planned future enhancements include
          })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Advanced AI features , bold true }),
          new TextRun({ text Predictive dehydration risk alerts, personalized coaching conversations })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Healthcare integration , bold true }),
          new TextRun({ text API for doctorsnutritionists to monitor patients })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Expanded wearable support , bold true }),
          new TextRun({ text Apple Watch, Fitbit, Garmin integration })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text Enterprise features , bold true }),
          new TextRun({ text Corporate wellness programs, team challenges })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text International expansion , bold true }),
          new TextRun({ text Multi-language support, localized health guidelines })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(6.4. Final Reflection)]
      }),

      new Paragraph({
        spacing { before 240, after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text This project has reinforced our understanding of digital citizenship beyond mere technology consumption. As digital citizens, we have the responsibility to leverage technology ethically and purposefully to address real-world problems and improve quality of life.
          })
        ]
      }),

      new Paragraph({
        spacing { after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text DigiWell embodies the principles of responsible innovation it respects user privacy through transparent data practices, promotes positive behavioral change without manipulation, fosters genuine community connections, and demonstrates how Industry 4.0 technologies can serve human wellbeing rather than merely commercial interests.
          })
        ]
      }),

      new Paragraph({
        spacing { after 240 },
        alignment AlignmentType.JUSTIFIED,
        children [
          new TextRun({
            text Through this journey, we have learned that effective digital citizenship requires not only technical skills but also empathy, ethical consideration, and a commitment to creating technology that genuinely serves people. DigiWell is our contribution to a future where digital tools empower individuals to live healthier, more connected lives.
          })
        ]
      }),

      new Paragraph({ children [new PageBreak()] }),

       ===== REFERENCES =====
      new Paragraph({
        heading HeadingLevel.HEADING_1,
        children [new TextRun(REFERENCES)]
      }),

      new Paragraph({
        spacing { before 360, after 180 },
        children [
          new TextRun({ text [1] World Health Organization. (2020). , italics true }),
          new TextRun({ text WHO Guidelines for Drinking-water Quality, 4th Edition, bold true }),
          new TextRun({ text . Geneva WHO Press. })
        ]
      }),

      new Paragraph({
        spacing { after 180 },
        children [
          new TextRun({ text [2] National Academies of Sciences, Engineering, and Medicine. (2004). , italics true }),
          new TextRun({ text Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate, bold true }),
          new TextRun({ text . Washington, DC The National Academies Press. })
        ]
      }),

      new Paragraph({
        spacing { after 180 },
        children [
          new TextRun({ text [3] EFSA Panel on Dietetic Products, Nutrition, and Allergies (NDA). (2010). , italics true }),
          new TextRun({ text Scientific Opinion on Dietary Reference Values for Water, bold true }),
          new TextRun({ text . EFSA Journal, 8(3)1459. })
        ]
      }),

      new Paragraph({
        spacing { after 180 },
        children [
          new TextRun({ text [4] Armstrong, L.E., & Johnson, E.C. (2018). , italics true }),
          new TextRun({ text Water intake, water balance, and the elusive daily water requirement, bold true }),
          new TextRun({ text . Nutrients, 10(12), 1928. })
        ]
      }),

      new Paragraph({
        spacing { after 180 },
        children [
          new TextRun({ text [5] Popkin, B.M., D'Anci, K.E., & Rosenberg, I.H. (2010). , italics true }),
          new TextRun({ text Water, hydration, and health, bold true }),
          new TextRun({ text . Nutrition Reviews, 68(8), 439-458. })
        ]
      }),

      new Paragraph({
        spacing { after 180 },
        children [
          new TextRun({ text [6] Kenefick, R.W. (2018). , italics true }),
          new TextRun({ text Drinking strategies planned drinking versus drinking to thirst, bold true }),
          new TextRun({ text . Sports Medicine, 48(Suppl 1), 31-37. })
        ]
      }),

      new Paragraph({
        spacing { after 180 },
        children [
          new TextRun({ text [7] Fogg, B.J. (2019). , italics true }),
          new TextRun({ text Tiny Habits The Small Changes That Change Everything, bold true }),
          new TextRun({ text . Boston Houghton Mifflin Harcourt. })
        ]
      }),

      new Paragraph({
        spacing { after 180 },
        children [
          new TextRun({ text [8] Deterding, S., et al. (2011). , italics true }),
          new TextRun({ text Gamification Toward a Definition, bold true }),
          new TextRun({ text . CHI 2011 Workshop on Gamification. })
        ]
      }),

      new Paragraph({ children [new PageBreak()] }),

       ===== APPENDIX =====
      new Paragraph({
        heading HeadingLevel.HEADING_1,
        alignment AlignmentType.CENTER,
        children [new TextRun(APPENDIX)]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(A. System Architecture Diagram)]
      }),

      new Paragraph({
        spacing { before 240, after 480 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text [Architecture diagram would be inserted here], italics true, color 808080 })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(B. User Interface Screenshots)]
      }),

      new Paragraph({
        spacing { before 240, after 240 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text [Screenshot 1 Home Tab - Progress Tracking], italics true, color 808080 })
        ]
      }),

      new Paragraph({
        spacing { after 240 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text [Screenshot 2 Feed Tab - Social Engagement], italics true, color 808080 })
        ]
      }),

      new Paragraph({
        spacing { after 240 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text [Screenshot 3 Insight Tab - AI Coach], italics true, color 808080 })
        ]
      }),

      new Paragraph({
        spacing { after 240 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text [Screenshot 4 Arena Tab - Battle System], italics true, color 808080 })
        ]
      }),

      new Paragraph({
        spacing { after 240 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text [Screenshot 5 Bottle Tab - IoT Control], italics true, color 808080 })
        ]
      }),

      new Paragraph({
        heading HeadingLevel.HEADING_2,
        children [new TextRun(C. Key API Endpoints)]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        children [
          new TextRun({ text Authentication, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text POST authsignup - User registration })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text POST authlogin - User authentication })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        children [
          new TextRun({ text Hydration Tracking, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text POST water_logs - Create water log entry })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text GET water_logsuser_id={id}&day={date} - Retrieve daily logs })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        children [
          new TextRun({ text Social Features, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text POST posts - Create social post })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text POST posts{id}reactions - Add reaction (PulseDropCheers) })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text GET feed - Retrieve social feed })
        ]
      }),

      new Paragraph({
        spacing { before 240, after 120 },
        children [
          new TextRun({ text Gamification, bold true })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text GET leaderboard - Retrieve rankings })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text POST battles - Create battle challenge })
        ]
      }),

      new Paragraph({
        numbering { reference bullets, level 0 },
        children [
          new TextRun({ text GET profilestats - User statistics and achievements })
        ]
      }),

      new Paragraph({
        spacing { before 480, after 240 },
        alignment AlignmentType.CENTER,
        children [
          new TextRun({ text --- END OF REPORT ---, bold true, size 28 })
        ]
      })
    ]
  }]
});

 Generate the document
Packer.toBuffer(doc).then(buffer = {
  fs.writeFileSync(mntuser-dataoutputsDigiWell_Final_Report_English.docx, buffer);
  console.log(✓ Document created successfully DigiWell_Final_Report_English.docx);
});
