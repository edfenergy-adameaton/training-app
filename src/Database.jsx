import "./Database.css";
import { useState } from "react";
import { Link } from "react-router-dom";

function Database() {
  const [formData, setFormData] = useState({
    // use a single useState rather than multiple
    firstName: "",
    surname: "",
    birthday: "",
    favouriteColour: "",
    favouriteNumber: "",
  });
  // this is the current form data

  // state management system for submission states
  const [submittedData, setSubmittedData] = useState(null); // stores form data after a successful submission - will hold copy of formData
  const [isSubmitting, setIsSubmitting] = useState(false); // this is mearly a submission flag

  const handleInputChange = (e) => {
    const { name, value } = e.target; //i.e the filed name and the value. makes it work with each field
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    // use async here since this process could take time, and want to avoid freezing page
    e.preventDefault(); // prevents the page from refreshing (since normal html would want to refresh the page on submit)
    setIsSubmitting(true);

    // Simulate API call delay of 1s
    setTimeout(() => {
      setSubmittedData(formData);
      setIsSubmitting(false);
      // Reset form
      setFormData({
        firstName: "",
        surname: "",
        birthday: "",
        favouriteColour: "",
        favouriteNumber: "",
      });
    }, 1000);
  };

  // Render the page header section
  const renderHeader = () => (
    <div className="database-header">
      <h1 className="database-title">Personal Information Database</h1>
      <p className="database-subtitle">Please fill in your details below</p>
    </div>
  );

  // Render form input fields
  const renderFormFields = () => (
    <>
      {renderTextInput("firstName", "First Name", "Enter your first name")}
      {renderTextInput("surname", "Surname", "Enter your surname")}
      {renderDateInput()}
      {renderColourSelect()}
      {renderNumberInput()}
    </>
  );

  // Render a generic text input field
  const renderTextInput = (name, label, placeholder) => (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label} *
      </label>
      <input
        id={name}
        name={name} // used in the for the handle input change, to see which field it is
        type="text"
        value={formData[name]}
        placeholder={placeholder}
        onChange={handleInputChange}
        className="form-input"
        required
      />
    </div>
  );

  // Render the birthday date input
  const renderDateInput = () => (
    <div className="form-group">
      <label htmlFor="birthday" className="form-label">
        Birthday *
      </label>
      <input
        id="birthday"
        name="birthday"
        type="date"
        value={formData.birthday}
        onChange={handleInputChange}
        className="form-input date-input"
        required
      />
    </div>
  );

  // Render the colour selection dropdown
  const renderColourSelect = () => (
    <div className="form-group">
      <label htmlFor="favouriteColour" className="form-label">
        Favourite Colour *
      </label>
      <select
        id="favouriteColour"
        name="favouriteColour"
        value={formData.favouriteColour}
        onChange={handleInputChange}
        className="form-input form-select"
        required
      >
        <option value="">Select your favourite colour</option>
        <option value="red">❤️ Red</option>
        <option value="blue">💙 Blue</option>
        <option value="green">💚 Green</option>
        <option value="yellow">💛 Yellow</option>
        <option value="purple">💜 Purple</option>
        <option value="orange">🧡 Orange</option>
        <option value="pink">🩷 Pink</option>
        <option value="black">🖤 Black</option>
        <option value="white">🤍 White</option>
        <option value="brown">🤎 Brown</option>
      </select>
    </div>
  );

  // Render the favourite number input
  const renderNumberInput = () => (
    <div className="form-group">
      <label htmlFor="favouriteNumber" className="form-label">
        Favourite Number *
      </label>
      <input
        id="favouriteNumber"
        name="favouriteNumber"
        type="number"
        value={formData.favouriteNumber}
        placeholder="Enter your favourite number"
        onChange={handleInputChange}
        className="form-input"
        min="1"
        max="1000"
        required
      />
    </div>
  );

  // Render the form action buttons
  const renderFormActions = () => (
    <div className="form-actions">
      <button type="submit" className="submit-button" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <span className="spinner"></span>
            Submitting...
          </>
        ) : (
          "Submit Information"
        )}
      </button>

      <Link to="/" className="home-link">
        <button type="button" className="home-button">
          🏠 Go Home
        </button>
      </Link>
    </div>
  );

  // Render the success message when form is submitted
  const renderSuccessMessage = () => {
    if (!submittedData) return null;

    return (
      <div className="success-message">
        <div className="success-header">
          <h3>✅ Information Submitted Successfully!</h3>
        </div>
        <div className="submitted-data">
          <div className="data-item">
            <strong>Name:</strong> {submittedData.firstName}{" "}
            {submittedData.surname}
          </div>
          <div className="data-item">
            <strong>Birthday:</strong>{" "}
            {new Date(submittedData.birthday).toLocaleDateString()}
          </div>
          <div className="data-item">
            <strong>Favourite Colour:</strong> {submittedData.favouriteColour}
          </div>
          <div className="data-item">
            <strong>Favourite Number:</strong> {submittedData.favouriteNumber}
          </div>
        </div>
      </div>
    );
  };

  // Main component render
  return (
    <div className="database-page">
      <div className="database-container">
        {renderHeader()}

        <div className="content-wrapper">
          <form onSubmit={handleSubmit} className="database-form">
            {renderFormFields()}
            {renderFormActions()}
          </form>

          {renderSuccessMessage()}
        </div>
      </div>
    </div>
  );
}

export default Database;
