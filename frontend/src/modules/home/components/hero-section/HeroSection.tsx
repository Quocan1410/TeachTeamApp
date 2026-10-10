import React from "react";
import Image from "next/image";
import styles from "./HeroSection.module.css";

interface HeroSectionProps {
  className?: string;
  placesOpen: number | null;
  placesLoading: boolean;
}

function scrollToApplySteps(event: React.MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
  event.currentTarget.blur();
  const target = document.getElementById("tutors-info");
  if (!target) return;
  const header = document.querySelector("header");
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";

  const gap = () =>
    target.getBoundingClientRect().top -
    (header?.getBoundingClientRect().bottom ?? 0);

  const start = window.scrollY;
  const before = gap();
  const probe = 40;
  window.scrollTo({ top: start + probe, behavior: "instant" });
  const after = gap();
  const moved = before - after;
  const perPixel = Math.abs(moved) > 0.5 ? moved / probe : 1;
  const top = Math.max(start + before / perPixel, 0);
  window.scrollTo({ top: start, behavior: "instant" });
  root.style.scrollBehavior = previous;
  window.scrollTo({ top, behavior: "smooth" });
}

const HeroSection: React.FC<HeroSectionProps> = ({
  className = "",
  placesOpen,
  placesLoading,
}) => {
  return (
    <section className={`${styles.heroSection} ${className}`} id="hero">
      <div className="container mx-auto relative z-10">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 animate-pulse">
          <div className={`${styles.heroSection__decorationCircle} bg-orange-200`}></div>
        </div>
        <div className={`absolute bottom-10 right-20 ${styles.heroSection__animateFloat}`}>
          <div className={styles.heroSection__decorationCircleOutline}></div>
        </div>
        <div className="absolute top-40 right-40">
          <div
            className={`${styles.heroSection__decorationGradientCircle} ${styles.heroSection__animateSlowSpin}`}
          ></div>
        </div>

        <div className={styles.heroSection__heroGrid}>
          <div>
            <h1 className={styles.heroSection__heroTitle}>
              Apply & Join <br />
              as a Tutor or <br />
              Lab Assistant
            </h1>
            <p className={styles.heroSection__heroSubtitle}>
              Connect with the School of Computer Science and apply for tutor
              and lab-assistant positions
            </p>
            <button
              type="button"
              className={`${styles.heroSection__heroBtn} scroll-link`}
              onClick={scrollToApplySteps}
            >
              Get Started
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={styles.heroSection__heroBtnIcon}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <div className={`${styles.heroSection__heroImageContainer} relative`}>
            <div className={styles.heroSection__pulseBackground}></div>
            <div className={`${styles.heroSection__imageWrapper} relative z-10`}>
              <Image
                src="/university-classroom.svg"
                alt="University classroom"
                fill={true}
                priority
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>

            {/* Floating elements */}
            <div className={`${styles.heroSection__floatingCardTop} ${styles.heroSection__animateFloat}`}>
              <div className={styles.heroSection__floatingCard}>
                <div className={styles.heroSection__floatingIconGreen}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={styles.heroSection__floatingIconSvg}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className={styles.heroSection__floatingCardText}>Tutor</span>
              </div>
            </div>
            <div
              className={`${styles.heroSection__floatingCardBottom} ${styles.heroSection__animateFloatDelayed}`}
            >
              <div className={styles.heroSection__floatingCard}>
                <div className={styles.heroSection__floatingIconBlue}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={styles.heroSection__floatingIconSvg}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                </div>
                <span className={styles.heroSection__floatingCardText}>Lab assistant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className={styles.heroSection__statsContainer}>
        <div className="container mx-auto">
          <div className={styles.heroSection__statsCard}>
            <div className={styles.heroSection__statsSection}>
              <div className={styles.heroSection__statsNumber}>
                22<sup>+</sup>
              </div>
              <p className={styles.heroSection__statsLabel}>Places open</p>
            </div>
            <div className={styles.heroSection__statsContent}>
              <p className={styles.heroSection__statsText}>
                {placesLoading
                  ? "Checking tutor and lab assistant places for this semester."
                  : placesOpen === null
                    ? "Open places could not be loaded right now."
                    : placesOpen === 0
                      ? "No tutor or lab assistant places are open this semester."
                      : "Tutor and lab assistant places are still open this semester."}
              </p>

              {/* Avatar row */}
              <div className={styles.heroSection__statsActions}>
                <div className={styles.heroSection__avatarGroup}>
                  {[...Array(9)].map((_, i) => (
                    <div className={styles.heroSection__avatar} key={i}>
                      <Image
                        src={`/avatars/avatar-${i + 1}.jpg`}
                        alt="User avatar"
                        width={36}
                        height={36}
                        style={{ width: "36px", height: "36px" }}
                        priority={i < 3}
                      />
                    </div>
                  ))}
                  <div className={`${styles.heroSection__avatar} ${styles.heroSection__plusAvatar}`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={styles.heroSection__plusIcon}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.heroSection__moreLink}
                  onClick={scrollToApplySteps}
                >
                  <div className={styles.heroSection__moreButton}>
                    <div className={styles.heroSection__moreButtonInner}>
                      <span className={styles.heroSection__moreText}>Explore more</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={styles.heroSection__moreButtonIcon}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
