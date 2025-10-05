import { useState, useEffect } from "react";
import "./Tutorial.css";

const Tutorial = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen the tutorial before
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    if (!hasSeenTutorial) {
      setIsVisible(true);
    }
  }, []);

  const steps = [
    {
      title: "Welcome to DisasteRisk*",
      description:
        "Analyze the potential impact of disasters on any location in the world.",
      icon: "🌍",
    },
    {
      title: "Search for a Location",
      description:
        "Use the search box to find any city, address, or landmark you want to analyze.",
      icon: "🔍",
    },
    {
      title: "Draw an Area",
      description:
        "Click the Draw button, then click on the map to outline the area you want to analyze.",
      icon: "✏️",
    },
    {
      title: "Set Magnitude",
      description:
        "Adjust the magnitude slider to simulate different disaster intensities (0-10 scale).",
      icon: "📊",
    },
    {
      title: "Get AI Analysis",
      description:
        "After drawing, our AI will analyze building density, population, and potential impact.",
      icon: "🤖",
    },
  ];

  const handleClose = () => {
    localStorage.setItem("hasSeenTutorial", "true");
    setIsVisible(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-modal">
        <button className="tutorial-close" onClick={handleSkip}>
          ×
        </button>

        <div className="tutorial-content">
          <div className="tutorial-icon">{currentStepData.icon}</div>
          <h2 className="tutorial-title">{currentStepData.title}</h2>
          <p className="tutorial-description">{currentStepData.description}</p>
        </div>

        <div className="tutorial-progress">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`tutorial-dot ${
                index === currentStep ? "active" : ""
              } ${index < currentStep ? "completed" : ""}`}
              onClick={() => setCurrentStep(index)}
            />
          ))}
        </div>

        <div className="tutorial-actions">
          <button
            className="tutorial-btn tutorial-btn-secondary"
            onClick={handleSkip}
          >
            Skip
          </button>
          <div className="tutorial-nav">
            {currentStep > 0 && (
              <button
                className="tutorial-btn tutorial-btn-secondary"
                onClick={handlePrevious}
              >
                Previous
              </button>
            )}
            <button
              className="tutorial-btn tutorial-btn-primary"
              onClick={handleNext}
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
