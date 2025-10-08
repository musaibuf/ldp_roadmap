import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Box, Typography, Button, Paper, Alert, Grid, TextField, CircularProgress,
  Checkbox, FormControlLabel, FormGroup, Tooltip, IconButton, LinearProgress, Accordion, AccordionSummary, AccordionDetails, Divider
} from '@mui/material';
import { createTheme, ThemeProvider, responsiveFontSizes } from '@mui/material/styles';

// --- ICONS ---
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SendIcon from '@mui/icons-material/Send';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
// Icons for Review Page
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FlagIcon from '@mui/icons-material/Flag';
import BuildIcon from '@mui/icons-material/Build';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import GroupIcon from '@mui/icons-material/Group';

// --- LOGO ---
import logo from './logo.png'; // Make sure logo.png is in the src folder

// --- THEME AND STYLES ---
let theme = createTheme({
  palette: {
    primary: { main: '#F57C00', light: 'rgba(245, 124, 0, 0.08)' },
    secondary: { main: '#B31B1B' },
    text: { primary: '#2c3e50', secondary: '#34495e' },
    background: { default: '#f8f9fa', paper: '#FFFFFF' },
    action: { hover: 'rgba(245, 124, 0, 0.04)' }
  },
  typography: {
    fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700, color: '#B31B1B', textAlign: 'center' },
    h2: { fontWeight: 600, color: '#B31B1B', textAlign: 'center', marginBottom: '1.5rem' },
    h4: { fontWeight: 600, color: '#2c3e50' },
    h5: { color: '#F57C00', fontWeight: 600 },
    body1: { fontSize: '1rem', color: '#2c3e50', lineHeight: 1.7 },
  },
});
theme = responsiveFontSizes(theme);

const containerStyles = {
  padding: { xs: 2, sm: 3, md: 4 },
  margin: { xs: '1rem auto', md: '2rem auto' },
  borderRadius: '15px',
  backgroundColor: 'background.paper',
  border: '1px solid #e9ecef',
  maxWidth: { xs: '100%', sm: '700px', md: '900px' },
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
};

// --- DATA FOR CHECKBOXES ---
const focusAreas = {
  self: ['Emotional Intelligence', 'Time & Energy Management', 'Resilience & Stress Management', 'Feedback Mindset'],
  relational: ['Communication Mastery', 'Delegation & Empowerment', 'Coaching & Mentoring Skills', 'Conflict Resolution', 'Inclusion & Belonging'],
  strategic: ['Vision & Goal Alignment', 'Decision-Making Under Uncertainty', 'Change Leadership', 'Innovation & Problem-Solving', 'Stakeholder Influence'],
};

// --- MAIN APP COMPONENT ---
function App() {
  const [step, setStep] = useState('welcome'); // 'welcome', 'form', 'review', 'submitted'
  const [userInfo, setUserInfo] = useState({ name: '', organization: '' });
  const [formData, setFormData] = useState({
    vision1: '', vision2: '',
    focusSelf: [], focusRelational: [], focusStrategic: [],
    goalSelf1: '', goalSelf2: '',
    goalRelational1: '', goalRelational2: '',
    goalStrategic1: '', goalStrategic2: '',
    devStretch: '', devCoaching: '', devLearning: '', devReflection: '',
    measureBehaviors: '', measureFeedback: '', measureIndicators: '',
    accountability: '',
  });
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  useEffect(() => {
    // --- FIX: Corrected the total number of fields to 19 for accurate percentage ---
    const totalFields = 19; 
    let completedFields = Object.values(formData).filter(value => (Array.isArray(value) ? value.length > 0 : Boolean(value))).length;
    setProgress((completedFields / totalFields) * 100);
  }, [formData]);

  const handleStart = () => {
    if (userInfo.name && userInfo.organization) {
      setStatus({ message: '', type: '' });
      setStep('form');
    } else {
      setStatus({ message: 'Please fill out both your name and organization.', type: 'error' });
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (category, value) => {
    const currentValues = formData[category];
    const newValues = currentValues.includes(value) ? currentValues.filter(item => item !== value) : [...currentValues, value];
    setFormData(prev => ({ ...prev, [category]: newValues }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.focusSelf.length < 2 || formData.focusSelf.length > 3 ||
        formData.focusRelational.length < 2 || formData.focusRelational.length > 3 ||
        formData.focusStrategic.length < 2 || formData.focusStrategic.length > 3) {
      setStatus({ message: 'Please select 2-3 items in each "Focus Areas for Growth" category.', type: 'error' });
      return;
    }
    
    setIsProcessing(true);
    setStatus({ message: 'Submitting your response...', type: 'info' });

    try {
      await axios.post('http://localhost:3001/api/submit', { userInfo, formData });
      setStatus({ message: 'Your response has been saved!', type: 'success' });
      setStep('review'); // Go to review page on successful submission
    } catch (error) {
      setStatus({ message: 'Submission failed. Please try again.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    setIsProcessing(true);
    setStatus({ message: 'Generating your report...', type: 'info' });
    try {
        const response = await axios.post('http://localhost:3001/api/generate-pdf', { userInfo, formData }, {
            responseType: 'blob',
        });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Leadership-Roadmap-${userInfo.name}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setStep('submitted'); // Move to final page after download starts
    } catch (err) {
        console.error("Error downloading PDF:", err);
        setStatus({ message: "Sorry, we couldn't generate your PDF at this time.", type: 'error' });
    } finally {
        setIsProcessing(false);
    }
  };

  const renderWelcome = () => (
    <Paper elevation={3} sx={containerStyles}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box component="img" src={logo} alt="Logo" sx={{ maxWidth: { xs: '100px', sm: '120px' }, height: 'auto' }} />
        <Typography variant="h1">Leader’s Development Roadmap</Typography>
        <Typography variant="h6" color="text.secondary" align="center" sx={{ fontWeight: 'normal', mt: 2 }}>
          Transform Your Leadership Skills with a Tailored Development Plan
        </Typography>
      </Box>
      <Divider sx={{ my: 4, borderColor: 'primary.main', borderWidth: '1px' }} />
      <Box sx={{ maxWidth: { xs: '100%', sm: 400 }, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField fullWidth label="Your Name" variant="outlined" value={userInfo.name} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })} />
        <TextField fullWidth label="Your Organization" variant="outlined" value={userInfo.organization} onChange={(e) => setUserInfo({ ...userInfo, organization: e.target.value })} />
        {status.message && status.type === 'error' && <Alert severity="error">{status.message}</Alert>}
        <Button variant="contained" size="large" color="primary" onClick={handleStart} disabled={!userInfo.name || !userInfo.organization} startIcon={<RocketLaunchIcon />} sx={{ mt: 2, py: 1.5 }}>
          Start
        </Button>
      </Box>
    </Paper>
  );

  const renderForm = () => (
    <Paper component="form" onSubmit={handleSubmit} elevation={3} sx={containerStyles}>
      <Box sx={{ mb: 4, position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1, py: 2 }}>
        <Typography variant="h2">My Development Roadmap</Typography>
        <LinearProgress variant="determinate" value={progress} sx={{ height: '8px', borderRadius: '4px', mt: 2 }} />
        <Typography variant="caption" display="block" textAlign="center" mt={1}>{Math.round(progress)}% Complete</Typography>
      </Box>
      {/* All FormSection and CheckboxGroup components remain the same */}
      <FormSection num="1" title="My Leadership Vision" tooltip="Define where you want to be in your leadership journey in 12 months.">
        <TextField fullWidth multiline rows={3} label="Where do I want to be in 12 months?" name="vision1" value={formData.vision1} onChange={handleFormChange} helperText='Example: "I want to be a strategic thinker who inspires my team through clear communication and trust."' sx={{ mb: 3 }} />
        <TextField fullWidth label="In one sentence, describe the kind of leader I aspire to be" name="vision2" value={formData.vision2} onChange={handleFormChange} helperText='Example: "I aspire to be a servant leader, focusing on empowering my team and fostering growth."' />
      </FormSection>
      <FormSection num="2" title="Focus Areas for Growth" tooltip="Choose the areas you want to focus on developing in the next 12 months.">
        <CheckboxGroup title="A. Self-Leadership (Months 1–3)" category="focusSelf" options={focusAreas.self} selected={formData.focusSelf} onChange={handleCheckboxChange} helperText="Select 2–3 of these topics to focus on during the first 3 months." />
        <CheckboxGroup title="B. Relational Leadership (Months 3–6)" category="focusRelational" options={focusAreas.relational} selected={formData.focusRelational} onChange={handleCheckboxChange} helperText="Select 2–3 from this list to focus on in the next 3 months." />
        <CheckboxGroup title="C. Strategic Leadership (Months 6–12)" category="focusStrategic" options={focusAreas.strategic} selected={formData.focusStrategic} onChange={handleCheckboxChange} helperText="Choose 2–3 to work on in the final phase." />
      </FormSection>
      <FormSection num="3" title="My Development Goals" tooltip="Set specific, measurable, achievable, relevant, and time-bound (SMART) goals for each phase.">
        <Typography variant="h6" gutterBottom>Months 1–3 (Self-Leadership)</Typography>
        <TextField fullWidth label="Goal 1: What is your first goal for self-leadership?" name="goalSelf1" value={formData.goalSelf1} onChange={handleFormChange} sx={{ mb: 2 }} />
        <TextField fullWidth label="Goal 2: What is your second goal?" name="goalSelf2" value={formData.goalSelf2} onChange={handleFormChange} sx={{ mb: 3 }} />
        <Typography variant="h6" gutterBottom>Months 3–6 (Relational Leadership)</Typography>
        <TextField fullWidth label="Goal 1: What will you achieve in this phase?" name="goalRelational1" value={formData.goalRelational1} onChange={handleFormChange} sx={{ mb: 2 }} />
        <TextField fullWidth label="Goal 2: What’s your second relational leadership goal?" name="goalRelational2" value={formData.goalRelational2} onChange={handleFormChange} sx={{ mb: 3 }} />
        <Typography variant="h6" gutterBottom>Months 6–12 (Strategic Leadership)</Typography>
        <TextField fullWidth label="Goal 1: How will you prepare for strategic leadership?" name="goalStrategic1" value={formData.goalStrategic1} onChange={handleFormChange} sx={{ mb: 2 }} />
        <TextField fullWidth label="Goal 2: What’s your second strategic leadership goal?" name="goalStrategic2" value={formData.goalStrategic2} onChange={handleFormChange} />
      </FormSection>
      <FormSection num="4" title="Development Activities" tooltip="Identify activities and support systems that will help you achieve these goals.">
        <TextField fullWidth multiline rows={3} label="Stretch Assignments" name="devStretch" value={formData.devStretch} onChange={handleFormChange} helperText="Describe any challenging assignments or projects that will push your limits." sx={{ mb: 3 }} />
        <TextField fullWidth multiline rows={3} label="Coaching/Mentorship" name="devCoaching" value={formData.devCoaching} onChange={handleFormChange} helperText="Who can help you? Do you have access to a coach or mentor?" sx={{ mb: 3 }} />
        <TextField fullWidth multiline rows={3} label="Learning (workshops, courses, books)" name="devLearning" value={formData.devLearning} onChange={handleFormChange} helperText="What resources (courses, books, etc.) will you use?" sx={{ mb: 3 }} />
        <TextField fullWidth multiline rows={3} label="Reflection Practices" name="devReflection" value={formData.devReflection} onChange={handleFormChange} helperText="How will you track your progress and reflect (journaling, peer circle, 360° feedback)?" />
      </FormSection>
      <FormSection num="5" title="Success Measures" tooltip="Establish clear metrics to track your progress and success.">
        <TextField fullWidth multiline rows={3} label="Key behaviors I will demonstrate" name="measureBehaviors" value={formData.measureBehaviors} onChange={handleFormChange} helperText='Example: "Being proactive in team meetings."' sx={{ mb: 3 }} />
        <TextField fullWidth multiline rows={3} label="Feedback sources I will seek" name="measureFeedback" value={formData.measureFeedback} onChange={handleFormChange} helperText='Example: "Peer reviews, mentor feedback."' sx={{ mb: 3 }} />
        <TextField fullWidth multiline rows={3} label="Indicators of success" name="measureIndicators" value={formData.measureIndicators} onChange={handleFormChange} helperText='Example: "Team feedback on improved communication, better project outcomes."' />
      </FormSection>
      <FormSection num="6" title="Accountability" tooltip="Identify who will hold you accountable to your goals.">
        <TextField fullWidth label="Who will I keep accountable?" name="accountability" value={formData.accountability} onChange={handleFormChange} helperText='Example: "My mentor, team members, or boss will check in monthly."' />
      </FormSection>
      <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #eee', textAlign: 'center' }}>
        {status.message && status.type !== 'success' && <Alert severity={status.type || 'info'} sx={{ mb: 2 }}>{status.message}</Alert>}
        <Button type="submit" variant="contained" size="large" disabled={isProcessing} startIcon={isProcessing ? <CircularProgress size={24} color="inherit" /> : <SendIcon />} sx={{ width: { xs: '100%', sm: 'auto' }, py: 1.5 }}>
          {isProcessing ? 'Submitting...' : 'Submit'}
        </Button>
      </Box>
    </Paper>
  );

  const renderReview = () => {
    const reviewData = [
        { num: '1', title: 'My Leadership Vision', icon: <VisibilityIcon />, items: [
            { label: 'Where I want to be in 12 months', value: formData.vision1 },
            { label: 'The kind of leader I aspire to be', value: formData.vision2 },
        ]},
        { num: '2', title: 'Focus Areas for Growth', icon: <CheckCircleOutlineIcon />, items: [
            { label: 'Self-Leadership', value: formData.focusSelf.join(' | ') },
            { label: 'Relational Leadership', value: formData.focusRelational.join(' | ') },
            { label: 'Strategic Leadership', value: formData.focusStrategic.join(' | ') },
        ]},
        { num: '3', title: 'My Development Goals', icon: <FlagIcon />, items: [
            { label: 'Self-Leadership Goal 1', value: formData.goalSelf1 },
            { label: 'Self-Leadership Goal 2', value: formData.goalSelf2 },
            { label: 'Relational Leadership Goal 1', value: formData.goalRelational1 },
            { label: 'Relational Leadership Goal 2', value: formData.goalRelational2 },
        ]},
        { num: '4', title: 'Development Activities', icon: <BuildIcon />, items: [
            { label: 'Stretch Assignments', value: formData.devStretch },
            { label: 'Coaching/Mentorship', value: formData.devCoaching },
            { label: 'Learning', value: formData.devLearning },
            { label: 'Reflection Practices', value: formData.devReflection },
        ]},
        { num: '5', title: 'Success Measures', icon: <PlaylistAddCheckIcon />, items: [
            { label: 'Key Behaviors', value: formData.measureBehaviors },
            { label: 'Feedback Sources', value: formData.measureFeedback },
            { label: 'Indicators of Success', value: formData.measureIndicators },
        ]},
        { num: '6', title: 'Accountability', icon: <GroupIcon />, items: [
            { label: 'Who will keep me accountable', value: formData.accountability },
        ]},
    ];

    return (
        <Paper elevation={3} sx={containerStyles}>
            <Typography variant="h2" textAlign="center">Submission Successful!</Typography>
            <Alert severity="success" sx={{ my: 2, justifyContent: 'center' }}>{status.message}</Alert>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }} textAlign="center">
                Please review your responses below. You can now download your report.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {reviewData.map(section => (
                    <ReviewCard key={section.num} icon={section.icon} title={`${section.num}. ${section.title}`} items={section.items} />
                ))}
            </Box>
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #eee', textAlign: 'center' }}>
                {status.message && status.type === 'error' && <Alert severity="error">{status.message}</Alert>}
                <Button variant="contained" size="large" onClick={handleDownload} disabled={isProcessing} startIcon={isProcessing ? <CircularProgress size={24} color="inherit" /> : <DownloadIcon />} sx={{ width: { xs: '100%', sm: 'auto' }, py: 1.5 }}>
                    {isProcessing ? 'Generating PDF...' : 'Download Responses'}
                </Button>
            </Box>
        </Paper>
    );
  };

  const renderSubmitted = () => (
    <Paper elevation={3} sx={containerStyles}>
      <Box sx={{ textAlign: 'center', p: { xs: 2, sm: 4 } }}>
        <Typography variant="h2" sx={{ mb: 2 }}>Thank You!</Typography>
        <Alert severity="success" icon={false} sx={{ justifyContent: 'center', mb: 4 }}>
          <Typography variant="h6">Your report download has started.</Typography>
        </Alert>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          You can now safely close this window.
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" sx={{ mt: { xs: 2, sm: 3 }, mb: 4, px: { xs: 2, sm: 3 } }}>
        {step === 'welcome' && renderWelcome()}
        {step === 'form' && renderForm()}
        {step === 'review' && renderReview()}
        {step === 'submitted' && renderSubmitted()}
      </Container>
    </ThemeProvider>
  );
}

// --- HELPER COMPONENTS ---
const FormSection = ({ num, title, tooltip, children }) => (
  <Accordion defaultExpanded sx={{ boxShadow: 'none', '&:before': { display: 'none' }, my: 2 }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
      <Typography variant="h4"><Box component="span" sx={{ color: 'primary.main' }}>{num}.</Box> {title}</Typography>
      <Tooltip title={tooltip} placement="top"><IconButton size="small" sx={{ ml: 1 }}><HelpOutlineIcon fontSize="small" /></IconButton></Tooltip>
    </AccordionSummary>
    <AccordionDetails sx={{ borderTop: '1px solid #eee', pt: 3 }}>{children}</AccordionDetails>
  </Accordion>
);

const CheckboxGroup = ({ title, category, options, selected, onChange, helperText }) => {
  const isError = selected.length > 0 && (selected.length < 2 || selected.length > 3);
  return (
    <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: isError ? 'error.main' : '#ddd', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <FormGroup>{options.map(option => (<FormControlLabel key={option} control={<Checkbox checked={selected.includes(option)} onChange={() => onChange(category, option)} />} label={option} />))}</FormGroup>
      <Typography variant="caption" color={isError ? 'error' : 'text.secondary'} sx={{ mt: 1, display: 'block' }}>{helperText} (Selected: {selected.length})</Typography>
    </Box>
  );
};

const ReviewCard = ({ icon, title, items }) => (
    <Paper variant="outlined" sx={{ borderRadius: 0, height: '100%', overflow: 'hidden', textAlign: 'left' }}>
        <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            p: 1.5, 
            backgroundColor: 'primary.light',
            borderBottom: '1px solid',
            borderColor: 'primary.main'
        }}>
            <Box sx={{ color: 'primary.main' }}>{icon}</Box>
            <Typography variant="h5" component="h3" sx={{ ml: 1.5, color: 'primary.main', fontWeight: 'bold' }}>{title}</Typography>
        </Box>
        <Box sx={{ p: 2 }}>
            {items.map(item => (
                <ReviewItem key={item.label} label={item.label} value={item.value} />
            ))}
        </Box>
    </Paper>
);

const ReviewItem = ({ label, value }) => (
    <Box sx={{ mb: 2, textAlign: 'left' }}>
        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{label}:</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', pl: 1, borderLeft: '2px solid #eee', ml: 0.5 }}>
            {value || <em>No response provided.</em>}
        </Typography>
    </Box>
);

export default App;