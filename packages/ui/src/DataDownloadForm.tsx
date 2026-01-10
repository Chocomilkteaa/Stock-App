/**
 * DataDownloadForm Component
 *
 * A form component for selecting a data type and date,
 * then triggering a CSV download from the backend API.
 */
import { useState, useMemo } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  type SelectChangeEvent,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";

// Import shared types and constants from DTO package
import {
  type DataType,
  DATA_TYPE_CONFIG,
  QUARTERS,
} from "@repo/dto";

// ===========================
// Props Interface
// ===========================

export interface DataDownloadFormProps {
  /** Base API URL (e.g., http://localhost:8080) */
  apiBaseUrl?: string;
}

// ===========================
// Component
// ===========================

export const DataDownloadForm = ({
  apiBaseUrl = "http://localhost:8080",
}: DataDownloadFormProps) => {
  // ---- State ----
  const [dataType, setDataType] = useState<DataType>("daily-prices");
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ---- Derived Values ----
  const config = DATA_TYPE_CONFIG[dataType];

  /** Calculate the maximum allowed date (no future dates) */
  const maxDate = useMemo(() => dayjs(), []);

  /** Check if a date should be disabled (weekends for daily prices) */
  const shouldDisableDate = (date: Dayjs) => {
    if (dataType === "daily-prices") {
      const day = date.day();
      return day === 0 || day === 6; // Disable Sunday (0) and Saturday (6)
    }
    return false;
  };

  /** Generate year options for quarter selector (last 10 years) */
  const yearOptions = useMemo(() => {
    const currentYear = dayjs().year();
    const years: number[] = [];
    for (let i = 0; i < 10; i++) {
      years.push(currentYear - i);
    }
    return years;
  }, []);

  /** Check if selected quarter is in the future */
  const isQuarterInFuture = useMemo(() => {
    const now = dayjs();
    const currentYear = now.year();
    const currentQuarter = Math.ceil((now.month() + 1) / 3);

    if (selectedYear > currentYear) return true;
    if (selectedYear === currentYear && selectedQuarter > currentQuarter)
      return true;
    return false;
  }, [selectedYear, selectedQuarter]);

  // ---- Handlers ----

  /** Handle data type change */
  const handleDataTypeChange = (event: SelectChangeEvent<DataType>) => {
    setDataType(event.target.value);
    setError(null);
    setSuccessMessage(null);
  };

  /** Handle year change for quarter selector */
  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setSelectedYear(event.target.value);
    setError(null);
    setSuccessMessage(null);
  };

  /** Handle quarter change */
  const handleQuarterChange = (event: SelectChangeEvent<number>) => {
    setSelectedQuarter(event.target.value);
    setError(null);
    setSuccessMessage(null);
  };

  /** Format date string for API request */
  const getFormattedDate = (): string => {
    if (config.dateFormat === "quarter") {
      return `${selectedYear}-Q${selectedQuarter}`;
    }
    if (!selectedDate) return "";
    return selectedDate.format(config.apiDateFormat);
  };

  /** Convert API response data to CSV format */
  const convertToCSV = (data: Record<string, unknown>[]): string => {
    if (!data || data.length === 0) return "";

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV header row
    const csvRows = [headers.join(",")];

    // Add data rows
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        // Handle null/undefined
        if (value === null || value === undefined) return "";
        // Handle strings with commas or quotes
        if (typeof value === "string") {
          if (value.includes(",") || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }
        return String(value);
      });
      csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
  };

  /** Trigger file download in browser */
  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /** Handle download button click */
  const handleDownload = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const dateString = getFormattedDate();
    const endpoint = `${apiBaseUrl}/crawler/${dataType}/${dateString}`;

    try {
      const response = await fetch(endpoint);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch data");
      }

      if (!result.data || result.data.length === 0) {
        setError("No data available for the selected date.");
        return;
      }

      // Convert to CSV and download
      const csv = convertToCSV(result.data);
      const filename = `${dataType}_${dateString}.csv`;
      downloadFile(csv, filename);

      setSuccessMessage(`Downloaded ${result.count} records as ${filename}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  /** Check if download button should be disabled */
  const isDownloadDisabled = () => {
    if (isLoading) return true;
    if (config.dateFormat === "quarter" && isQuarterInFuture) return true;
    if (config.dateFormat !== "quarter" && !selectedDate) return true;
    if (config.dateFormat !== "quarter" && selectedDate?.isAfter(maxDate))
      return true;
    return false;
  };

  // ---- Render ----
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 480,
          mx: "auto",
          mt: 4,
          borderRadius: 3,
          background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)",
        }}
      >
        {/* Header */}
        <Typography
          variant="h4"
          component="h1"
          sx={{
            mb: 3,
            fontWeight: 700,
            textAlign: "center",
            background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          📊 Data Download Center
        </Typography>

        {/* Data Type Selector */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="data-type-label" sx={{ color: "#a0aec0" }}>
            Data Type
          </InputLabel>
          <Select
            labelId="data-type-label"
            value={dataType}
            label="Data Type"
            onChange={handleDataTypeChange}
            sx={{
              color: "#e2e8f0",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#4a5568",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#667eea",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#667eea",
              },
            }}
          >
            {Object.entries(DATA_TYPE_CONFIG).map(([key, cfg]) => (
              <MenuItem key={key} value={key}>
                {cfg.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Date Input - Dynamic based on data type */}
        {config.dateFormat === "date" && (
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={setSelectedDate}
            maxDate={maxDate}
            shouldDisableDate={shouldDisableDate}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: {
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    color: "#e2e8f0",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#4a5568",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#667eea",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#667eea",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#a0aec0",
                  },
                },
              },
            }}
          />
        )}

        {config.dateFormat === "month" && (
          <DatePicker
            label="Select Month"
            value={selectedDate}
            onChange={setSelectedDate}
            maxDate={maxDate}
            views={["year", "month"]}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: {
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    color: "#e2e8f0",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#4a5568",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#667eea",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#667eea",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#a0aec0",
                  },
                },
              },
            }}
          />
        )}

        {config.dateFormat === "quarter" && (
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            {/* Year Selector */}
            <FormControl sx={{ flex: 1 }}>
              <InputLabel id="year-label" sx={{ color: "#a0aec0" }}>
                Year
              </InputLabel>
              <Select
                labelId="year-label"
                value={selectedYear}
                label="Year"
                onChange={handleYearChange}
                sx={{
                  color: "#e2e8f0",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#4a5568",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#667eea",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#667eea",
                  },
                }}
              >
                {yearOptions.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Quarter Selector */}
            <FormControl sx={{ flex: 1 }}>
              <InputLabel id="quarter-label" sx={{ color: "#a0aec0" }}>
                Quarter
              </InputLabel>
              <Select
                labelId="quarter-label"
                value={selectedQuarter}
                label="Quarter"
                onChange={handleQuarterChange}
                sx={{
                  color: "#e2e8f0",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#4a5568",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#667eea",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#667eea",
                  },
                }}
              >
                {QUARTERS.map((q) => (
                  <MenuItem key={q.value} value={q.value}>
                    {q.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Warning for future quarter */}
        {config.dateFormat === "quarter" && isQuarterInFuture && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Cannot select future quarters
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {/* Download Button */}
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleDownload}
          disabled={isDownloadDisabled()}
          sx={{
            py: 1.5,
            fontWeight: 600,
            fontSize: "1rem",
            background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
            "&:hover": {
              background: "linear-gradient(90deg, #5a67d8 0%, #6b46c1 100%)",
              transform: "translateY(-2px)",
              boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
            },
            "&:disabled": {
              background: "#4a5568",
              color: "#a0aec0",
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} sx={{ color: "#fff" }} />
          ) : (
            "⬇️ Download CSV"
          )}
        </Button>
      </Paper>
    </LocalizationProvider>
  );
};
