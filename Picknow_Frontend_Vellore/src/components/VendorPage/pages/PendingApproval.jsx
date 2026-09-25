import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Tooltip,
  useTheme,
  useMediaQuery,
  Avatar,
  Stack,
  Container,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { styled, alpha } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldOutlined,
  VerifiedUser,
  AccessTime,
  Email,
  CheckCircle,
  ContactSupport,
  ArrowForward,
} from "@mui/icons-material";

const Wrapper = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#020617",
  position: "relative",
  overflow: "hidden",
  padding: theme.spacing(3),
  "&::before": {
    content: '""',
    position: "absolute",
    width: "140%",
    height: "140%",
    top: "-20%",
    left: "-20%",
    background: "radial-gradient(circle at 20% 30%, rgba(255, 81, 47, 0.1) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(240, 152, 25, 0.1) 0%, transparent 40%)",
    animation: "rotate 20s linear infinite",
  },
  "@keyframes rotate": {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  },
}));

const GlassCard = styled(motion.div)(({ theme }) => ({
  width: "100%",
  maxWidth: "1100px",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: theme.spacing(6),
  padding: theme.spacing(6),
  borderRadius: "32px",
  background: "rgba(255, 255, 255, 0.03)",
  backdropFilter: "blur(24px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
  color: "white",
  position: "relative",
  zIndex: 1,
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
    padding: theme.spacing(4),
  },
}));

const StatusBadge = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: "8px 16px",
  borderRadius: "100px",
  background: "rgba(245, 158, 11, 0.1)",
  color: "#f59e0b",
  fontWeight: 700,
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "1px",
  marginBottom: "24px",
  border: "1px solid rgba(245, 158, 11, 0.2)",
}));

const StepCard = styled(motion.div)(({ theme, active }) => ({
  padding: theme.spacing(3),
  borderRadius: "20px",
  background: active ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.03)",
  border: "1px solid",
  borderColor: active ? "rgba(255, 81, 47, 0.3)" : "rgba(255, 255, 255, 0.05)",
  marginBottom: theme.spacing(2),
  display: "flex",
  gap: theme.spacing(3),
  alignItems: "center",
  transition: "all 0.3s ease",
  cursor: "pointer",
  "&:hover": {
    background: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 81, 47, 0.2)",
  },
}));

const StyledProgress = styled(LinearProgress)(({ theme }) => ({
  height: 12,
  borderRadius: 6,
  background: "rgba(255, 255, 255, 0.05)",
  "& .MuiLinearProgress-bar": {
    borderRadius: 6,
    background: "linear-gradient(90deg, #ff512f, #f09819)",
  },
}));

const PendingApproval = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const status = localStorage.getItem("approvalStatus");
      if (status === "verified") {
        navigate("/vendor/dashboard");
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  const steps = [
    {
      icon: <VerifiedUser />,
      title: "Document Verification",
      desc: "Our team is reviewing your submitted business licenses.",
      tip: "We verify GST, FSSAI, and ID proofs.",
    },
    {
      icon: <AccessTime />,
      title: "Review Timeline",
      desc: "Expect a response within 3–7 business days.",
      tip: "Quality checks take a little time.",
    },
    {
      icon: <Email />,
      title: "Email Confirmation",
      desc: "Look out for an approval email in your inbox.",
      tip: "Check your registered email address.",
    },
    {
      icon: <CheckCircle />,
      title: "Direct Outreach",
      desc: "We'll call you if further clarification is needed.",
      tip: "Our support team is here to help.",
    },
  ];

  return (
    <Wrapper>
      <GlassCard
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* LEFT COLUMN */}
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatusBadge>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#f59e0b",
                  animation: "pulse 2s infinite",
                }}
              />
              Verification In Progress
            </StatusBadge>

            <Typography
              variant={isMobile ? "h4" : "h2"}
              fontWeight={900}
              mb={2}
              sx={{
                background: "linear-gradient(135deg, #fff 0%, #cbd5e1 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-1px",
              }}
            >
              Almost there!
            </Typography>

            <Typography
              variant="h6"
              sx={{ color: "#94a3b8", mb: 4, lineHeight: 1.6, fontWeight: 400 }}
            >
              Your vendor application is currently under professional review. We're setting up your workspace for a seamless experience.
            </Typography>

            <Box sx={{ position: "relative", mb: 5 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mb: 3,
                  background: "linear-gradient(135deg, #ff512f 0%, #f09819 100%)",
                  boxShadow: "0 15px 30px rgba(255, 81, 47, 0.3)",
                }}
              >
                <ShieldOutlined sx={{ fontSize: 40 }} />
              </Avatar>

              <Box sx={{ width: "100%", maxWidth: "400px" }}>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" sx={{ color: "#94a3b8", fontWeight: 600 }}>
                    Profile Completion
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#f59e0b", fontWeight: 700 }}>
                    75%
                  </Typography>
                </Stack>
                <StyledProgress variant="determinate" value={75} />
                <Typography mt={2} fontSize={14} sx={{ color: "#64748b", fontStyle: "italic" }}>
                  "Precision takes time. Thank you for your patience."
                </Typography>
              </Box>
            </Box>
          </motion.div>
        </Box>

        {/* RIGHT COLUMN */}
        <Box>
          <Typography
            variant="h5"
            mb={4}
            fontWeight={700}
            sx={{ display: "flex", alignItems: "center", gap: 2 }}
          >
            What happens next?
            <Box sx={{ height: "2px", flex: 1, background: "rgba(255,255,255,0.05)" }} />
          </Typography>

          <AnimatePresence mode="popLayout">
            {steps.map((step, i) => (
              <Tooltip key={i} title={step.tip} arrow placement="left">
                <StepCard
                  active={hovered === i}
                  onHoverStart={() => setHovered(i)}
                  onHoverEnd={() => setHovered(null)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  whileHover={{ x: 10 }}
                >
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: alpha(theme.palette.warning.main, 0.1),
                      color: "#f97316",
                    }}
                  >
                    {step.icon}
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {step.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                      {step.desc}
                    </Typography>
                  </Box>

                  {hovered === i && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <ArrowForward sx={{ color: "#f97316", fontSize: 20 }} />
                    </motion.div>
                  )}
                </StepCard>
              </Tooltip>
            ))}
          </AnimatePresence>

          <Button
            variant="outlined"
            startIcon={<ContactSupport />}
            onClick={() => (window.location.href = "mailto:support@picknow.com")}
            sx={{
              mt: 4,
              py: 2,
              px: 4,
              borderRadius: "16px",
              textTransform: "none",
              fontWeight: 800,
              fontSize: "1rem",
              background: "white",
              color: "#0f172a",
              boxShadow: "0 10px 25px rgba(255,255,255,0.1)",
              transition: "all 0.3s ease",
              "&:hover": {
                background: "#f8fafc",
                transform: "translateY(-2px)",
                boxShadow: "0 15px 30px rgba(255,255,255,0.15)",
              },
            }}
            fullWidth
          >
            Talk to Vendor Support
          </Button>
        </Box>
      </GlassCard>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(0.95); opacity: 0.5; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.5; }
          }
        `}
      </style>
    </Wrapper>
  );
};

export default PendingApproval;