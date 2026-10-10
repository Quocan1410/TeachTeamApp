"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./TutorHeroSection.module.css";

export type ApplyLaterReminder = {
  id: string;
  courseCode: string;
  daysLeft: number;
};

interface TutorHeroSectionProps {
  children?: React.ReactNode;
  reminders?: ApplyLaterReminder[];
}

const LINES = [
  "Curious about the note?",
  "Bits are in the note.",
  "Tap me to open the note.",
];

const NOTES = [
  "Each course can offer a tutor role and a lab-assistant role.",
  "The date on a card is when applications close.",
  "Heart a course to keep it and apply later.",
  "About a month before that date, if you still have not applied, we remind you.",
  "After you apply, follow the role under Applications.",
];

const TutorHeroSection: React.FC<TutorHeroSectionProps> = ({
  children,
  reminders = [],
}) => {
  const [notesOpen, setNotesOpen] = useState(false);
  const [line, setLine] = useState(0);
  const [bubbleOn, setBubbleOn] = useState(true);
  const notesWereOpen = useRef(false);

  useEffect(() => {
    if (notesOpen) {
      notesWereOpen.current = true;
      setBubbleOn(false);
      return;
    }

    const startHidden = notesWereOpen.current;
    notesWereOpen.current = false;
    let showing = !startHidden;
    setBubbleOn(showing);

    const id = window.setInterval(() => {
      showing = !showing;
      if (!showing) {
        setLine((current) => (current + 1) % LINES.length);
      }
      setBubbleOn(showing);
    }, 9000);
    return () => window.clearInterval(id);
  }, [notesOpen]);

  return (
    <section className={styles.tutorHeroSection}>
      <div className={styles.tutorHeroSection__inner}>
        <h1 className={styles.tutorHeroSection__tutorHeroTitle}>
          Find your{" "}
          <span className={styles.tutorHeroSection__doubleWord} data-text="Teaching Roles">
            Teaching Roles
          </span>
        </h1>

        <div className={styles.tutorHeroSection__heroRow}>
          <div className={styles.tutorHeroSection__searchCol}>{children}</div>
          <div className={styles.tutorHeroSection__mascotCol}>
            <button
              type="button"
              className={styles.tutorHeroSection__mascotButton}
              aria-expanded={notesOpen}
              onClick={() => setNotesOpen((open) => !open)}
            >
              {!notesOpen && bubbleOn && (
                <span key={line} className={styles.tutorHeroSection__bubble} aria-live="polite">
                  {LINES[line]}
                </span>
              )}
              <Image
                src="/mascot/mascot-1.png"
                alt=""
                width={320}
                height={320}
                className={styles.tutorHeroSection__mascot}
              />
            </button>
            {notesOpen && (
              <div className={styles.tutorHeroSection__notes} role="note">
                <p className={styles.tutorHeroSection__notesTitle}>A few useful notes</p>
                <ul>
                  {NOTES.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {reminders.length > 0 && (
          <ul className={styles.tutorHeroSection__reminders}>
            {reminders.map((item) => (
              <li key={item.id}>
                {item.courseCode} has about {item.daysLeft}{" "}
                {item.daysLeft === 1 ? "day" : "days"} left, and you have not
                applied yet.
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default TutorHeroSection;
