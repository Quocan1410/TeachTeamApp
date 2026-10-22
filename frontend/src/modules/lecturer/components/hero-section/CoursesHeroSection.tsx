"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "@/modules/tutor/components/hero-section/TutorHeroSection.module.css";

interface CoursesHeroSectionProps {
  children?: React.ReactNode;
}

const LINES = [
  "Curious about the note?",
  "Bits are in the note.",
  "Tap me to open the note.",
];

const NOTES = [
  "Draft freely — published changes need admin approval.",
  "Set capacity and tutorial size before applicants apply.",
  "Pending means a change is waiting on admin review.",
];

/** Outline title + mascot notes — same spirit as /tutor, not a 1:1 clone of its filter UI. */
const CoursesHeroSection: React.FC<CoursesHeroSectionProps> = ({
  children,
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
        <h1
          className={styles.tutorHeroSection__tutorHeroTitle}
          data-tour="lecturer-courses-header"
        >
          Shape your{" "}
          <span
            className={styles.tutorHeroSection__doubleWord}
            data-text="Assigned Courses"
          >
            Assigned Courses
          </span>
        </h1>

        <div className={styles.tutorHeroSection__heroRow}>
          <div className={styles.tutorHeroSection__searchCol}>{children}</div>
          <div
            className={styles.tutorHeroSection__mascotCol}
            data-tour="lecturer-courses-helper"
          >
            <button
              type="button"
              className={styles.tutorHeroSection__mascotButton}
              aria-expanded={notesOpen}
              aria-label="Open helpful notes"
              onClick={() => setNotesOpen((open) => !open)}
            >
              {!notesOpen && bubbleOn && (
                <span
                  key={line}
                  className={styles.tutorHeroSection__bubble}
                  aria-live="polite"
                >
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
                <p className={styles.tutorHeroSection__notesTitle}>
                  A few useful notes
                </p>
                <ul>
                  {NOTES.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={styles.tutorHeroSection__replayTour}
                  onClick={() => {
                    setNotesOpen(false);
                    window.location.assign("/profile#help-guides");
                  }}
                >
                  Guides in Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoursesHeroSection;
