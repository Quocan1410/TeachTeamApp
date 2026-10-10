import React from "react";
import LoadingIcon from "@/shared/components/common/loading-icon/LoadingIcon";
import styles from "./LoadingWrapper.module.css";

interface LoadingWrapperProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingMessage?: string;
  minHeight?: string;
  position?: "center" | "top" | "flex-start" | "top-center";
}

const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  isLoading,
  children,
  loadingMessage = "Loading...",
  minHeight = "200px",
  position = "center",
}) => {
  if (isLoading) {
    let justifyContent = position;
    let paddingTop = undefined;
    
    // Special handling for top-center position
    if (position === "top-center") {
      justifyContent = "flex-start";
      paddingTop = "8rem"; // Add top padding to push content down
    }

    const containerStyle = {
      minHeight,
      justifyContent,
      paddingTop,
    };

    return (
      <div className={styles.loadingWrapper__loadingContainer} style={containerStyle}>
        <LoadingIcon size={40} />
        <p className={styles.loadingWrapper__loadingMessage}>{loadingMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default LoadingWrapper;
