import { useState } from "react";
import "./App.css";

function App() {
  const [mode, setMode] = useState("single");

  // Single product states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  // Single result states
  const [result, setResult] = useState(null);

  // Batch states
  const [products, setProducts] = useState([
    {
      title: "",
      description: "",
      image: null,
      preview: "",
    },
    {
      title: "",
      description: "",
      image: null,
      preview: "",
    },
  ]);

  const [batchResults, setBatchResults] = useState(null);

  // Common states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------- SINGLE PRODUCT ----------------

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];

    if (selectedImage) {
      setImage(selectedImage);
      setPreview(URL.createObjectURL(selectedImage));
      setResult(null);
      setError("");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    setError("");
    setResult(null);

    if (!title || !description || !image) {
      setError(
        "Please enter the product title, description, and image."
      );
      return;
    }

    const formData = new FormData();

    formData.append("title", title);
    formData.append("description", description);
    formData.append("image", image);

    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:8000/verify",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Verification failed."
        );
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleReset = () => {
    setTitle("");
    setDescription("");
    setImage(null);
    setPreview("");
    setResult(null);
    setError("");
  };

  // ---------------- BATCH PRODUCTS ----------------

  const updateProduct = (index, field, value) => {
    const updatedProducts = [...products];

    updatedProducts[index][field] = value;

    setProducts(updatedProducts);
    setBatchResults(null);
    setError("");
  };

  const handleBatchImageChange = (index, e) => {
    const selectedImage = e.target.files[0];

    if (!selectedImage) {
      return;
    }

    const updatedProducts = [...products];

    updatedProducts[index].image = selectedImage;
    updatedProducts[index].preview =
      URL.createObjectURL(selectedImage);

    setProducts(updatedProducts);
    setBatchResults(null);
    setError("");
  };

  const addProduct = () => {
    setProducts([
      ...products,
      {
        title: "",
        description: "",
        image: null,
        preview: "",
      },
    ]);
  };

  const removeProduct = (index) => {
    if (products.length <= 2) {
      setError("At least two products are required for batch verification.");
      return;
    }

    const updatedProducts = products.filter(
      (_, productIndex) => productIndex !== index
    );

    setProducts(updatedProducts);
    setBatchResults(null);
    setError("");
  };

  const handleBatchVerify = async (e) => {
    e.preventDefault();

    setError("");
    setBatchResults(null);

    for (let i = 0; i < products.length; i++) {
      if (
        !products[i].title ||
        !products[i].description ||
        !products[i].image
      ) {
        setError(
          `Please complete Product ${i + 1} before verifying.`
        );
        return;
      }
    }

    const formData = new FormData();

    products.forEach((product) => {
      formData.append("titles", product.title);
      formData.append(
        "descriptions",
        product.description
      );
      formData.append("images", product.image);
    });

    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:8000/verify-batch",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Batch verification failed."
        );
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setBatchResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetBatch = () => {
    setProducts([
      {
        title: "",
        description: "",
        image: null,
        preview: "",
      },
      {
        title: "",
        description: "",
        image: null,
        preview: "",
      },
    ]);

    setBatchResults(null);
    setError("");
  };

  return (
    <div className="page">
      <div className="container">

        {/* HEADER */}

        <header className="header">
          <div className="badge">
            AI-POWERED MARKETPLACE VERIFICATION
          </div>

          <h1>Product Image Correctness</h1>

          <p>
            Verify whether marketplace product images match
            their titles and descriptions using AI-based
            image-text similarity.
          </p>
        </header>

        {/* MODE BUTTONS */}

        <div className="mode-switch">
          <button
            className={
              mode === "single"
                ? "mode-button active"
                : "mode-button"
            }
            onClick={() => {
              setMode("single");
              setError("");
            }}
          >
            Single Verification
          </button>

          <button
            className={
              mode === "batch"
                ? "mode-button active"
                : "mode-button"
            }
            onClick={() => {
              setMode("batch");
              setError("");
            }}
          >
            Batch Verification
          </button>
        </div>

        {/* ---------------- SINGLE MODE ---------------- */}

        {mode === "single" && (
          <div className="main-card">

            <form onSubmit={handleVerify}>

              <div className="form-group">
                <label>Product Title</label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="Example: Men's Wrist Watch"
                />
              </div>

              <div className="form-group">
                <label>Product Description</label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Describe the product..."
                  rows="5"
                />
              </div>

              <div className="form-group">
                <label>Product Image</label>

                <div className="upload-box">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />

                  <p>Choose a product image</p>

                  {image && (
                    <span className="file-name">
                      {image.name}
                    </span>
                  )}
                </div>
              </div>

              {preview && (
                <div className="preview-section">
                  <h3>Image Preview</h3>

                  <img
                    src={preview}
                    alt="Product preview"
                    className="preview-image"
                  />
                </div>
              )}

              <div className="button-row">

                <button
                  type="submit"
                  className="verify-button"
                  disabled={loading}
                >
                  {loading
                    ? "Analyzing..."
                    : "Verify Product"}
                </button>

                <button
                  type="button"
                  className="reset-button"
                  onClick={handleSingleReset}
                >
                  Reset
                </button>

              </div>
            </form>

            {result && (
              <div
                className={`result-card ${
                  result.verification_result ===
                  "Correct"
                    ? "correct"
                    : "incorrect"
                }`}
              >
                <h2>Verification Result</h2>

                <div className="result-status">
                  {result.verification_result ===
                  "Correct"
                    ? "✓ PRODUCT IMAGE AND INFORMATION MATCH"
                    : "✕ POSSIBLE PRODUCT IMAGE MISMATCH"}
                </div>

                <div className="result-details">

                  <div>
                    <span>Product</span>
                    <strong>{result.title}</strong>
                  </div>

                  <div>
                    <span>Cosine Similarity</span>
                    <strong>
                      {result.cosine_similarity}
                    </strong>
                  </div>

                  <div>
                    <span>Threshold</span>
                    <strong>
                      {result.threshold}
                    </strong>
                  </div>

                </div>

                <p className="result-note">
                  The result is based on semantic similarity
                  between the uploaded image and the provided
                  product information.
                </p>
              </div>
            )}

          </div>
        )}

        {/* ---------------- BATCH MODE ---------------- */}

        {mode === "batch" && (
          <div className="main-card">

            <div className="batch-header">
              <h2>Batch Product Verification</h2>

              <p>
                Add multiple marketplace listings and verify
                them together in a single operation.
              </p>
            </div>

            <form onSubmit={handleBatchVerify}>

              {products.map((product, index) => (
                <div
                  className="batch-product"
                  key={index}
                >
                  <div className="batch-product-header">
                    <h3>
                      Product {index + 1}
                    </h3>

                    {products.length > 2 && (
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() =>
                          removeProduct(index)
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Product Title</label>

                    <input
                      type="text"
                      value={product.title}
                      onChange={(e) =>
                        updateProduct(
                          index,
                          "title",
                          e.target.value
                        )
                      }
                      placeholder="Enter product title"
                    />
                  </div>

                  <div className="form-group">
                    <label>Product Description</label>

                    <textarea
                      value={product.description}
                      onChange={(e) =>
                        updateProduct(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Enter product description"
                      rows="4"
                    />
                  </div>

                  <div className="form-group">
                    <label>Product Image</label>

                    <div className="upload-box">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleBatchImageChange(
                            index,
                            e
                          )
                        }
                      />

                      <p>Choose a product image</p>

                      {product.image && (
                        <span className="file-name">
                          {product.image.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {product.preview && (
                    <div className="batch-preview">
                      <img
                        src={product.preview}
                        alt={`Product ${index + 1}`}
                      />
                    </div>
                  )}

                </div>
              ))}

              <div className="batch-buttons">

                <button
                  type="button"
                  className="add-button"
                  onClick={addProduct}
                >
                  + Add Another Product
                </button>

                <button
                  type="submit"
                  className="verify-button"
                  disabled={loading}
                >
                  {loading
                    ? "Checking All Products..."
                    : "Verify All Products"}
                </button>

                <button
                  type="button"
                  className="reset-button"
                  onClick={resetBatch}
                >
                  Reset Batch
                </button>

              </div>
            </form>

            {batchResults && (
              <div className="batch-results">

                <h2>Batch Verification Results</h2>

                <p className="batch-total">
                  Total products checked:{" "}
                  <strong>
                    {batchResults.total_products}
                  </strong>
                </p>

                <div className="results-table-wrapper">
                  <table className="results-table">

                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Product</th>
                        <th>Similarity</th>
                        <th>Threshold</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {batchResults.results.map(
                        (item, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>

                            <td>
                              {item.title}
                            </td>

                            <td>
                              {item.cosine_similarity}
                            </td>

                            <td>
                              {item.threshold}
                            </td>

                            <td>
                              <span
                                className={
                                  item.verification_result ===
                                  "Correct"
                                    ? "status-correct"
                                    : "status-incorrect"
                                }
                              >
                                {item.verification_result ===
                                "Correct"
                                  ? "✓ Correct"
                                  : "✕ Incorrect"}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>

                  </table>
                </div>

                <p className="result-note">
                  Batch verification allows multiple marketplace
                  listings to be screened in a single operation.
                </p>

              </div>
            )}

          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* HOW IT WORKS */}

        <section className="how-it-works">
          <h2>How It Works</h2>

          <p className="how-subtitle">
            Our system checks whether the uploaded product
            image is semantically consistent with the seller's
            product information.
          </p>

          <div className="steps">

            <div className="step">
              <div className="step-number">1</div>

              <h3>Enter Product Information</h3>

              <p>
                Enter the product title and description
                provided by the seller.
              </p>
            </div>

            <div className="step">
              <div className="step-number">2</div>

              <h3>Upload Product Image</h3>

              <p>
                Upload the image that will be used for
                verification.
              </p>
            </div>

            <div className="step">
              <div className="step-number">3</div>

              <h3>AI Comparison</h3>

              <p>
                CLIP creates image and text embeddings and
                calculates their cosine similarity.
              </p>
            </div>

            <div className="step">
              <div className="step-number">4</div>

              <h3>Verification Result</h3>

              <p>
                The system compares the score with the
                threshold and displays the verification result.
              </p>
            </div>

          </div>
        </section>

        {/* WHY SYSTEM */}

        <section className="why-system">
          <h2>Why This System?</h2>

          <p>
            Online marketplaces may receive a large number
            of product listings. Manually checking whether
            every uploaded image matches its title and
            description can be time-consuming.
          </p>

          <p>
            Our system uses AI-based image-text similarity
            to automatically identify potential mismatches
            and help marketplace platforms perform faster
            listing verification.
          </p>
        </section>

        <footer>
          <p>
            Mini Project • Image Correctness for a Product
            on Marketplace
          </p>
        </footer>

      </div>
    </div>
  );
}

export default App;