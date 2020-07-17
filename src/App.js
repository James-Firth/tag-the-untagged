import React from 'react';
import './App.css';

import * as api from './api';

// All types except, well tags.
const ENTITY_TYPES = ['characters', 'locations', 'families', 'organisations', 'items', 'notes', 'events', 'calendars', 'races', 'quests', 'journals', 'abilities', 'conversations', 'dice_rolls'];


function App() {
  const [accessToken, setAccessToken] = React.useState("");
  const [step, setStep] = React.useState(1);
  const [campaigns, setCampaigns] = React.useState([]);
  const [selectedCampaignID, setCampaignId] = React.useState(107);
  const [tagColour] = React.useState('pink');
  const [tagName, setTagName] = React.useState('uncategorized');
  const [tagType] = React.useState('meta');
  const [tagPrivate] = React.useState(true);
  const [metaTagId, setMetaTagId] = React.useState(null);
  const [isTagging, setIsTagging] = React.useState(false);
  const [completed, setIsCompleted] = React.useState(false);
  const [currentlyTagging, setCurrentlyTagging] = React.useState("");
  const [isPatron, setIsPatron] = React.useState(false);

  async function createUntaggedTag() {
    // Now we create our untagged tag. Perhaps give the user some options for that?

    const untaggedTagId = await api.createTag({
      name: tagName, // or "to-tag"? or "untagged"?
      type: tagType,
      color: tagColour,
      is_private: tagPrivate, // sure why not
    });
    console.log('meta tag ID ', untaggedTagId);
    setMetaTagId(untaggedTagId);
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
      setIsCompleted(selectedCampaignID);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTagging(false);
    }


  }

  const stepOne = (
    <div>
      <h3>Step 1: Enter Personal Access Token</h3>
      <p>You can get one from your <a href="https://kanka.io/en/settings/api">user settings</a> on kanka.io</p>
      <p>Note: I will look at an auth workflow in the future, but for now this is simplest</p>
      <input type="text" value={accessToken} onChange={setAccessToken} />
      <button onClick={async () => {
        if (typeof accessToken !== 'string' || accessToken.trim() < 1) {
          alert('Access token must not be blank');
          return;
        }
        api.setupAxios(api.KANKA_BASE_URL, accessToken);
        const res = await api.instance.get();
        if (res.data) {
          setCampaigns(res.data.data);
        }
        setStep(3);
      }}>Set Token</button>
    </div>
  )

  const stepTwo = (
    <div>
      {step === 2 && <h3>Step Two: Select Your Campaign</h3>}
      <select value={selectedCampaignID} onChange={(x) => {
        const campaignId = x.target.value;
        setCampaignId(campaignId)
        api.setupAxios(`${api.KANKA_BASE_URL}/${campaignId}`, accessToken);
      }}>
        {
          campaigns && campaigns.map(camp => <option key={camp.id} value={camp.id}>{camp.name}</option>)
        }
      </select>
    </div>
  )

  const stepThree = (
    <div>
      <h3> Step 3: Create an "Untagged" tag</h3>
      <label htmlFor='tagName' style={{ marginRight: '1em' }}>Tag Name</label>
      <input type="text" value={tagName} onChange={setTagName} />
      <div>Tag Type: {tagType}</div>
      <div>Tag Colour: {tagColour}</div>
      <div>Tag is private: {tagPrivate.toString()}</div>
      <div>Tag ID: {metaTagId}</div>
      <button onClick={createUntaggedTag}>Create Tag</button>
    </div>
  )

  const steps = [null, stepOne, stepTwo, stepThree];


  return (
    <div className="App">
      <header className="App-header">
        <div>
          <h2>Tag the Untagged for Kanka.io</h2>
        </div> 
      </header>
      { step > 1 && <div>
        <input type="checkbox" name="isPatron" defaultChecked={isPatron} onChange={() => {
          const newState = !isPatron;
          setIsPatron(!newState);
          api.instance.setRateLimitOptions({ maxRequests: newState ? 90 : 30, perMilliseconds: 1000 * 60})
        }}/>
        <label htmlFor="isPatron">Are you an Owlbear or Elemental tier subscriber?</label>
      </div>
}
      <div>
          {
              steps[step]
            }
            {
              step > 2 && stepTwo
            }


            {
              metaTagId && <button onClick={tagAllTheThings}>Start Tagging!</button>
            }

            {isTagging && <p>Tagging all untagged entities. This may take a few minutes depending on the number of untagged entities your campaign has.</p>}
            <p>{currentlyTagging}</p>
          { completed && <p>All previously untagged entities are now tagged as {tagName}! <a href={`https://kanka.io/en/campaign/${selectedCampaignID}/tags/${metaTagId}`}>View them here</a></p>}
        </div>
    </div>
  );
}

export default App;
