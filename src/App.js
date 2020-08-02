import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Container from '@material-ui/core/Container';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import CircularProgress from '@material-ui/core/CircularProgress';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import Step from '@material-ui/core/Step';
import StepButton from '@material-ui/core/StepButton';
import Stepper from '@material-ui/core/Stepper';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Snackbar from '@material-ui/core/Snackbar';

import './App.css';
import * as api from './api';

// All types except, well tags.
const ENTITY_TYPES = ['characters', 'locations', 'families', 'organisations', 'items', 'notes', 'events', 'calendars', 'races', 'quests', 'journals', 'abilities', 'conversations', 'dice_rolls'];


const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  button: {
    marginRight: theme.spacing(1),
  },
  completed: {
    display: 'inline-block',
  },
  instructions: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
}));



export default function HorizontalNonLinearStepper() {
  const classes = useStyles();
  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState({});
  const steps = getSteps();

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(false);
  const [accessToken, setAccessToken] = React.useState("");
  const [campaigns, setCampaigns] = React.useState([]);
  const [selectedCampaignName, setCampaignName] = React.useState("");
  const [selectedCampaignID, setCampaignId] = React.useState('');
  const [tagColour] = React.useState('pink');
  const [tagName, setTagName] = React.useState('uncategorized');
  const [tagType] = React.useState('meta');
  const [tagPrivate] = React.useState(true);
  const [metaTagId, setMetaTagId] = React.useState(null);
  const [isTagging, setIsTagging] = React.useState(false);
  const [finishedTagging, setIsFinished] = React.useState(false);
  const [currentlyTagging, setCurrentlyTagging] = React.useState("");
  const [isPatron, setIsPatron] = React.useState(false);


  function getSteps() {
    return ['Set API Token', `Select Campaign`, 'Create untagged Tag', 'Get Tagging!'];
  }

  function getStepContent(step) {
    switch (step) {
      case 0:
        return setAccessTokenView;
      case 1:
        return selectCampaignView;
      case 2:
        return untaggedView;
      case 3:
        return getTaggingView;
      default:
        return 'Unknown step';
    }
  }


  async function createUntaggedTag() {
    // Now we create our untagged tag. Perhaps give the user some options for that?

    try {
      setIsLoading(true);
      const untaggedTagId = await api.createTag({
        name: tagName, // or "to-tag"? or "untagged"?
        type: tagType,
        color: tagColour,
        is_private: tagPrivate, // sure why not
      });
      console.log('meta tag ID ', untaggedTagId);
      setMetaTagId(untaggedTagId);
      handleComplete();
    } catch (error) {
      console.error(error);
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }

  }

  async function tagAllTheThings() {
    setIsTagging(true);
    try {
      console.log('meta 1:', metaTagId);
      // Now we go iterate
      for (const entityType of ENTITY_TYPES) {
        console.log(`=== ${entityType} ===`);
        const untaggedOfType = await api.getllAllUntaggedOfType(entityType, true);
        setCurrentlyTagging(`Currently tagging ${untaggedOfType.length} ${entityType}`);
        console.log(`tagging with ${tagName} tag`);
        for (const untagged of untaggedOfType) {
          await api.tagEntity(untagged.entity_id, metaTagId);
        }
        console.log('all untagged entites are tagged');
      }
      setCurrentlyTagging('Complete!')
      setIsFinished(selectedCampaignID);
    } catch (error) {
      console.error(error);
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
      setIsTagging(false);
    }
  }

  const setAccessTokenView = (
    <div>
      <h3>Step 1: Enter Personal Access Token</h3>
      <p>You can get one from your <a href="https://kanka.io/en/settings/api">user settings</a> on kanka.io</p>
      <p>Note: I will look at an auth workflow in the future, but for now this is simplest</p>
      <TextField id="access-token" label="Access Token" value={accessToken} onChange={(event) => setAccessToken(event.target.value)} />
      <Button variant="contained" color="primary" onClick={async () => {
        if (typeof accessToken !== 'string' || accessToken.trim() < 1) {
          alert('Access token must not be blank');
          return;
        }
        try {
          api.setupAxios(api.KANKA_BASE_URL, accessToken);
          setIsLoading(true);
          const res = await api.instance.get();
          if (res.data) {
            setCampaigns(res.data.data);
            handleComplete();
          }
        } catch (error) {
          console.error(error);
          setSnackbarOpen(true);
        } finally {
          setIsLoading(false);
        }
      }}>Set Token</Button>
      {isLoading && <CircularProgress />}
    </div>
  )

  const selectCampaignView = (
    <div>
      <h3>Step Two: Select Campaign to Tag</h3>

      <FormControl className={classes.formControl}>
        <InputLabel htmlFor="campign-native-simple">Campaign</InputLabel>
        <Select
          native
          value={selectedCampaignID}
          onChange={(x) => {
            try {
              const campaignId = x.target.value;
              setCampaignId(campaignId);
              const found = campaigns.find(c => c.id === Number.parseInt(campaignId));
              setCampaignName(found.name);
              api.setupAxios(`${api.KANKA_BASE_URL}/${campaignId}`, accessToken);
              handleComplete();
            } catch (error) {
              console.error(error);
              setSnackbarOpen(true);
            } finally {
              setIsLoading(false);
            }
          }}
          inputProps={{
            name: 'campaign',
            id: 'campaign-native-simple',
          }}
        >
          <option aria-label="None" value="" />
          {
            campaigns && campaigns.map(camp => <option key={camp.id} value={camp.id}>{camp.name}</option>)
          }
        </Select>
      </FormControl>
    </div>
  );

  const untaggedView = (
    <div>
      <h3> Step 3: Create an "Untagged" tag</h3>
      <label htmlFor='tagName' style={{ marginRight: '1em' }}>Tag Name</label>
      <input type="text" value={tagName} onChange={(event) => setTagName(event.target.value)} />
      <div>Tag Type: {tagType}</div>
      <div>Tag Colour: {tagColour}</div>
      <div>Tag is private: {tagPrivate.toString()}</div>
      <div>Tag ID: {metaTagId}</div>
      <Button variant="contained" color="primary" onClick={createUntaggedTag}>Create Tag</Button>
      {isLoading && <CircularProgress />}
    </div>
  )

  const getTaggingView = (
    <div>
      <h3>Final Step: Get tagging!</h3>
      <div style={{ marginBottom: '2em' }}>
        <div style={{ marginBottom: '1em' }}>
          <b>Campaign to Tag:</b> <i>{selectedCampaignName}</i> <br />
          <b>Tag to be applied:</b> <i>{tagName} (#{metaTagId})</i> <br />
          <FormControlLabel
            control={<Checkbox
              checked={isPatron}
              onChange={(event) => {
                try {
                  const checkboxValue = event.target.checked;
                  if (api && api.instance != null) {
                    setIsPatron(checkboxValue);
                    api.instance.setRateLimitOptions({ maxRequests: checkboxValue ? 90 : 30, perMilliseconds: 1000 * 60 })
                    console.log(`Rate Limit set to ${checkboxValue ? 90 : 30} requests per minute`);
                  } else {
                    throw new Error('Api token must be set first!');
                  }
                } catch (error) {
                  console.error(error);
                  setSnackbarOpen(true);
                }
              }}
              inputProps={{ 'aria-label': 'primary checkbox' }}
            />}
            label="Are you an Owlbear or Elemental tier subscriber? (faster)"
          />
        </div>
        <div>
          {isTagging && <div><p>Tagging all untagged entities. This may take a few minutes depending on the number of untagged entities your campaign has.</p> <CircularProgress /></div>}
          <p>{currentlyTagging}</p>
          {finishedTagging && <p>All previously untagged entities are now tagged as <i>{tagName}</i>! <a href={`https://kanka.io/en/campaign/${selectedCampaignID}/tags/${metaTagId}`}>View them here</a></p>}
        </div>
      </div>
      {
        metaTagId && <Button variant="contained" color="primary" onClick={tagAllTheThings}>Start Tagging!</Button>
      }

    </div>
  )


  const totalSteps = () => {
    return steps.length;
  };

  const completedSteps = () => {
    return Object.keys(completed).length;
  };

  const isLastStep = () => {
    return activeStep === totalSteps() - 1;
  };

  const allStepsCompleted = () => {
    return completedSteps() === totalSteps();
  };

  const handleNext = () => {
    const newActiveStep =
      isLastStep() && !allStepsCompleted()
        ? // It's the last step, but not all steps have been completed,
        // find the first step that has been completed
        steps.findIndex((step, i) => !(i in completed))
        : activeStep + 1;
    setActiveStep(newActiveStep);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStep = (step) => () => {
    setActiveStep(step);
  };

  const handleComplete = () => {
    const newCompleted = completed;
    newCompleted[activeStep] = true;
    setCompleted(newCompleted);
    handleNext();
  };

  const handleReset = () => {
    setActiveStep(0);
    setCompleted({});
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  }

  return (
    <div className={classes.root}>
      <header className="App-header">
        <div>
          <h2>Tag the Untagged for Kanka.io</h2>
        </div>
      </header>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={snackbarOpen}
        severity="error"
        onClose={handleCloseSnackbar}
        message='An Error has occurred'
      />
      <Stepper nonLinear activeStep={activeStep}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepButton onClick={handleStep(index)} completed={completed[index]}>
              {label}
            </StepButton>
          </Step>
        ))}
      </Stepper>
      <div>
        {allStepsCompleted() ? (
          <div>
            <Typography className={classes.instructions}>
              All steps completed - you&apos;re finished
            </Typography>
            <Button onClick={handleReset}>Reset</Button>
          </div>
        ) : (
            <div>
              <Container maxWidth="md" style={{ padding: '5em' }}>
                {getStepContent(activeStep)}
              </Container>
              <div>
                <Button disabled={activeStep === 0} onClick={handleBack} className={classes.button}>
                  Back
              </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  className={classes.button}
                >
                  Next
              </Button>
              </div>
            </div>
          )}
      </div>
      <footer>
        <a target="_blank" href="https://icons8.com/icons/set/book-and-pencil">Book And Pencil icon</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
      </footer>
    </div>
  );
}
