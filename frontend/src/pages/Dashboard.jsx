import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:5000";

function Dashboard() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSlots] = useState(6);

  const [selectedSpot, setSelectedSpot] = useState(null);
  const [bookingStep, setBookingStep] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [gateStatus, setGateStatus] = useState("closed");
  const [transactionId, setTransactionId] = useState("");

  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  // ==================== Fetch Parking Status ====================
  const fetchParkingStatus = async () => {
    try {
      const res = await axios.get(`${API}/api/parking/status`);
      const data = res.data;

      const availableCount = data.available ?? totalSlots;
      const newSpots = [];
      for (let i = 1; i <= totalSlots; i++) {
        newSpots.push({
          id: i,
          status: i <= totalSlots - availableCount ? "occupied" : "available",
        });
      }
      setSpots(newSpots);
      setLoading(false);
    } catch (err) {
      console.error("Error:", err);
      showNotification("Failed to fetch parking data", "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingStatus();
    const interval = setInterval(fetchParkingStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // ==================== Notification ====================
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000,
    );
  };

  // ==================== Spot Select ====================
  const handleSpotSelect = (spot) => {
    if (spot.status !== "available") {
      showNotification(`Spot ${spot.id} is ${spot.status}`, "warning");
      return;
    }
    if (bookingStep > 0) return;
    setSelectedSpot(spot);
    setBookingStep(1);
  };

  // ==================== Confirm Booking ====================
  const confirmBooking = async () => {
    if (!selectedSpot) {
      console.log("❌ No spot selected!");
      return;
    }

    console.log("🔄 Booking spot:", selectedSpot.id);

    try {
      const res = await axios.post(`${API}/api/booking`, {
        spotId: selectedSpot.id,
      });

      console.log("✅ Booking response:", res.data);

      if (res.data.success) {
        showNotification(`✅ Spot ${selectedSpot.id} booked!`, "success");
        setBookingStep(2);
        await fetchParkingStatus();
      }
    } catch (err) {
      console.log("❌ Booking error:", err);
      showNotification(
        err.response?.data?.message || "Booking failed",
        "error",
      );
    }
  };

  // ==================== Demo Payment ====================
  const processPayment = async () => {
    if (!selectedSpot) return;
    setPaymentStatus("processing");

    // Demo — 2 second delay simulate කරනවා
    setTimeout(async () => {
      try {
        const res = await axios.post(`${API}/api/payment`, {
          spotId: selectedSpot.id,
          amount: 500,
        });

        if (res.data.success) {
          setTransactionId(res.data.transactionId);
          setPaymentStatus("success");
          setBookingStep(3);
          showNotification("💳 Payment successful!", "success");
        }
      } catch (err) {
        setPaymentStatus("failed");
        showNotification("Payment failed. Try again.", "error");
      }
    }, 2000);
  };

  // ==================== Gate Open ====================
  // Payment කළ user manually gate open කරනවා
  const openGate = async () => {
    setGateStatus("opening");
    try {
      await axios.post(`${API}/api/gate/open`);
      setGateStatus("open");
      showNotification("🚪 Gate is OPEN! Drive in now!", "success");

      // 5 seconds පස්සේ auto close
      setTimeout(async () => {
        setGateStatus("closing");
        setTimeout(() => {
          setGateStatus("closed");
          showNotification("🔒 Gate CLOSED", "info");
          resetBooking();
        }, 2000);
      }, 5000);
    } catch (err) {
      setGateStatus("closed");
      showNotification("Failed to open gate", "error");
    }
  };

  // ==================== Reset ====================
  const resetBooking = () => {
    setSelectedSpot(null);
    setBookingStep(0);
    setPaymentStatus("pending");
    setTransactionId("");
  };

  // ==================== Stats ====================
  const availableCount = spots.filter((s) => s.status === "available").length;
  const occupiedCount = spots.filter((s) => s.status === "occupied").length;

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return {
          bg: "#f0fff4",
          border: "#38a169",
          text: "#2e7d32",
          dot: "#38a169",
        };
      case "occupied":
        return {
          bg: "#fff5f5",
          border: "#e53e3e",
          text: "#c62828",
          dot: "#e53e3e",
        };
      default:
        return {
          bg: "#f7fafc",
          border: "#e2e8f0",
          text: "#718096",
          dot: "#a0aec0",
        };
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Initializing Smart Parking System...</p>
        <p style={styles.loadingSub}>Connecting to sensors & backend</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Notification */}
      {notification.show && (
        <div
          style={{
            ...styles.notification,
            backgroundColor:
              notification.type === "error"
                ? "#fed7d7"
                : notification.type === "success"
                  ? "#c6f6d5"
                  : notification.type === "warning"
                    ? "#fefcbf"
                    : "#bee3f8",
          }}
        >
          <span
            style={{
              color:
                notification.type === "error"
                  ? "#c53030"
                  : notification.type === "success"
                    ? "#276749"
                    : notification.type === "warning"
                      ? "#d69e2e"
                      : "#2c5aa0",
            }}
          >
            {notification.message}
          </span>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Smart Parking System</h1>
        <p style={styles.subtitle}>Real-time Parking Management Dashboard</p>
        <div style={styles.statusIndicator}>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor:
                gateStatus === "open"
                  ? "#38a169"
                  : gateStatus === "opening" || gateStatus === "closing"
                    ? "#ed8936"
                    : "#e53e3e",
            }}
          ></span>
          <span style={styles.statusText}>
            Gate: {gateStatus.charAt(0).toUpperCase() + gateStatus.slice(1)}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, color: "#4299e1" }}></div>
          <div style={styles.statValue}>{totalSlots}</div>
          <div style={styles.statLabel}>Total Slots</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, color: "#38a169" }}></div>
          <div style={{ ...styles.statValue, color: "#38a169" }}>
            {availableCount}
          </div>
          <div style={styles.statLabel}>Available</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, color: "#e53e3e" }}></div>
          <div style={{ ...styles.statValue, color: "#e53e3e" }}>
            {occupiedCount}
          </div>
          <div style={styles.statLabel}>Occupied</div>
        </div>
      </div>

      {/* Booking Panel */}
      {bookingStep > 0 && (
        <div style={styles.bookingPanel}>
          {/* Progress Steps */}
          <div style={styles.bookingFlow}>
            {["Book", "Pay", "Gate"].map((label, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  flex: i < 2 ? 1 : "none",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      ...styles.flowStep,
                      backgroundColor:
                        bookingStep > i
                          ? "#38a169"
                          : bookingStep === i + 1
                            ? "#3182ce"
                            : "#e2e8f0",
                      color: bookingStep >= i + 1 ? "white" : "#718096",
                    }}
                  >
                    {bookingStep > i ? "✓" : i + 1}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#8c8c8c",
                      marginTop: "4px",
                    }}
                  >
                    {label}
                  </div>
                </div>
                {i < 2 && <div style={styles.flowLine}></div>}
              </div>
            ))}
          </div>

          {/* Step 1 — Confirm Booking */}
          {bookingStep === 1 && selectedSpot && (
            <div style={styles.bookingInfo}>
              <h3>📋 Confirm Booking</h3>
              <div style={styles.bookingDetail}>
                <p>
                  Spot: <strong>Spot {selectedSpot.id}</strong>
                </p>
                <p>
                  ⏱️ Rate: <strong>Rs. 500 / hour</strong>
                </p>
              </div>
              <div style={styles.bookingActions}>
                <button style={styles.cancelBtn} onClick={resetBooking}>
                  Cancel
                </button>
                <button style={styles.confirmBtn} onClick={confirmBooking}>
                  Confirm Booking
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Demo Payment */}
          {bookingStep === 2 && (
            <div style={styles.bookingInfo}>
              <h3>💳 Demo Payment</h3>
              <p style={{ color: "#8c8c8c" }}>
                Spot {selectedSpot?.id} reservation
              </p>

              {/* Demo Card UI */}
              <div style={styles.demoCard}>
                <div style={styles.demoCardChip}>💳</div>
                <div style={styles.demoCardNumber}>**** **** **** 4242</div>
                <div style={styles.demoCardInfo}>
                  <span>DEMO CARD</span>
                  <span>12/26</span>
                </div>
              </div>

              <p style={styles.amount}>
                Amount: <strong>Rs. 500.00</strong>
              </p>

              <button
                style={{
                  ...styles.payNowBtn,
                  opacity: paymentStatus === "processing" ? 0.7 : 1,
                  cursor:
                    paymentStatus === "processing" ? "not-allowed" : "pointer",
                }}
                onClick={processPayment}
                disabled={paymentStatus === "processing"}
              >
                {paymentStatus === "processing"
                  ? "⏳ Processing..."
                  : "💳 Pay Now (Demo)"}
              </button>

              {paymentStatus === "failed" && (
                <p style={styles.errorText}>
                  ❌ Payment failed. Please try again.
                </p>
              )}
              <button style={styles.cancelBtn} onClick={resetBooking}>
                Cancel
              </button>
            </div>
          )}

          {/* Step 3 — Gate Open */}
          {bookingStep === 3 && paymentStatus === "success" && (
            <div style={styles.bookingInfo}>
              <h3>✅ Payment Successful!</h3>
              <p style={{ color: "#38a169" }}>
                Transaction: <strong>{transactionId}</strong>
              </p>
              <p style={{ color: "#8c8c8c" }}>
                Drive to the gate and press <strong>Open Gate</strong>
              </p>

              <button
                style={{
                  ...styles.openGateBtn,
                  opacity:
                    gateStatus === "opening" || gateStatus === "closing"
                      ? 0.7
                      : 1,
                  cursor:
                    gateStatus === "opening" || gateStatus === "closing"
                      ? "not-allowed"
                      : "pointer",
                  backgroundColor:
                    gateStatus === "open"
                      ? "#38a169"
                      : gateStatus === "opening"
                        ? "#ed8936"
                        : "#1890ff",
                }}
                onClick={openGate}
                disabled={
                  gateStatus === "opening" ||
                  gateStatus === "closing" ||
                  gateStatus === "open"
                }
              >
                {gateStatus === "opening"
                  ? "⏳ Opening Gate..."
                  : gateStatus === "open"
                    ? "🚪 Gate is OPEN!"
                    : gateStatus === "closing"
                      ? "🔒 Closing..."
                      : "🚪 Open Gate Now"}
              </button>

              {gateStatus !== "open" && gateStatus !== "opening" && (
                <button style={styles.newBookingBtn} onClick={resetBooking}>
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Parking Grid */}
      <div style={styles.sectionTitle}>Parking Spots</div>
      <div style={styles.grid}>
        {spots.map((spot) => {
          const colors = getStatusColor(spot.status);
          const isSelected = selectedSpot?.id === spot.id;

          return (
            <div
              key={spot.id}
              style={{
                ...styles.card,
                backgroundColor: colors.bg,
                borderColor: isSelected ? "#3182ce" : colors.border,
                boxShadow: isSelected
                  ? "0 4px 12px rgba(49,130,206,0.3)"
                  : "0 2px 4px rgba(0,0,0,0.05)",
                transform: isSelected ? "scale(1.03)" : "scale(1)",
                cursor: spot.status === "available" ? "pointer" : "default",
              }}
              onClick={() => handleSpotSelect(spot)}
            >
              <div style={styles.cardHeader}>
                <span style={styles.spotId}>Spot {spot.id}</span>
                <span
                  style={{ ...styles.statusDot, backgroundColor: colors.dot }}
                />
              </div>
              <p style={{ ...styles.statusLabel, color: colors.text }}>
                {spot.status.charAt(0).toUpperCase() + spot.status.slice(1)}
              </p>

              {spot.status === "available" && bookingStep === 0 && (
                <button
                  style={styles.bookSmallBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpotSelect(spot);
                  }}
                >
                  Select →
                </button>
              )}

              {spot.status === "occupied" && (
                <div
                  style={{
                    ...styles.badge,
                    backgroundColor: "#fed7d7",
                    color: "#c62828",
                  }}
                >
                  🚗 Occupied
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div style={styles.infoSection}>
        <div style={styles.infoItem}>
          <span>📡</span> ESP8266 Active
        </div>
        <div style={styles.infoItem}>
          <span>🔔</span> IR Sensors Monitoring
        </div>
        <div style={styles.infoItem}>
          <span>🖥️</span> LCD: {availableCount} slots available
        </div>
        <div style={styles.infoItem}>
          <span>🔄</span> Auto-refresh: 3s
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    padding: "20px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    gap: "16px",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #e0e0e0",
    borderTopColor: "#1890ff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: { fontSize: "18px", color: "#262626", margin: 0 },
  loadingSub: { fontSize: "14px", color: "#8c8c8c", margin: 0 },
  notification: {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "12px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    zIndex: 1000,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  header: {
    textAlign: "center",
    marginBottom: "24px",
    padding: "20px",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1890ff",
    margin: "0 0 8px 0",
  },
  subtitle: { fontSize: "14px", color: "#8c8c8c", margin: 0 },
  statusIndicator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "12px",
  },
  statusDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    display: "inline-block",
  },
  statusText: { fontSize: "14px", color: "#595959" },
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  statIcon: { fontSize: "28px", display: "block", marginBottom: "12px" },
  statValue: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#262626",
    margin: 0,
  },
  statLabel: { fontSize: "13px", color: "#8c8c8c", marginTop: "4px" },
  bookingPanel: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "12px",
    marginBottom: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  bookingFlow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: "24px",
  },
  flowStep: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
  },
  flowLine: {
    flex: 1,
    height: "2px",
    backgroundColor: "#e2e8f0",
    margin: "18px 8px 0",
  },
  bookingInfo: { textAlign: "center" },
  bookingDetail: {
    backgroundColor: "#f7fafc",
    borderRadius: "8px",
    padding: "16px",
    margin: "16px 0",
    display: "inline-block",
    textAlign: "left",
    minWidth: "200px",
  },
  bookingActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    marginTop: "16px",
  },
  cancelBtn: {
    padding: "10px 24px",
    backgroundColor: "#f5f5f5",
    color: "#595959",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  confirmBtn: {
    padding: "10px 24px",
    backgroundColor: "#1890ff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  demoCard: {
    background: "linear-gradient(135deg, #1890ff, #096dd9)",
    borderRadius: "12px",
    padding: "20px",
    margin: "16px auto",
    maxWidth: "280px",
    color: "white",
    textAlign: "left",
  },
  demoCardChip: { fontSize: "24px", marginBottom: "12px" },
  demoCardNumber: {
    fontSize: "16px",
    letterSpacing: "2px",
    marginBottom: "12px",
  },
  demoCardInfo: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    opacity: 0.8,
  },
  amount: { fontSize: "18px", color: "#262626", margin: "12px 0" },
  payNowBtn: {
    padding: "12px 32px",
    backgroundColor: "#52c41a",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    margin: "12px 8px",
    display: "block",
    width: "100%",
  },
  openGateBtn: {
    padding: "16px 40px",
    backgroundColor: "#1890ff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "18px",
    fontWeight: "700",
    cursor: "pointer",
    margin: "16px 8px",
    display: "block",
    width: "100%",
  },
  newBookingBtn: {
    padding: "10px 24px",
    backgroundColor: "#f5f5f5",
    color: "#595959",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "8px",
  },
  errorText: { color: "#ff4d4f", fontSize: "14px", margin: "8px 0" },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#262626",
    marginBottom: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    border: "2px solid",
    transition: "all 0.2s ease",
    position: "relative",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  spotId: { fontSize: "18px", fontWeight: "700", color: "#262626" },
  statusLabel: { fontSize: "14px", fontWeight: "500", marginBottom: "12px" },
  bookSmallBtn: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#1890ff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  badge: {
    textAlign: "center",
    padding: "8px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
  },
  infoSection: {
    display: "flex",
    justifyContent: "center",
    gap: "24px",
    flexWrap: "wrap",
    padding: "20px",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  infoItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#8c8c8c",
  },
};

export default Dashboard;
