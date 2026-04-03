import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { peopleOutline, barChartOutline, calendarOutline, informationCircle, barbellOutline, helpCircleOutline, bodyOutline, medal } from 'ionicons/icons';
import Sessions from './pages/Sessions';
import Patients from './pages/Patients';
import PhysioReports from './pages/PhysioReports';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import ManageSessions from './pages/ManageSessions';
import ManagePatients from './pages/ManagePatients';
import ViewSession from './pages/ViewSession';
import ViewPatient from './pages/ViewPatient';

import ReactGA from 'react-ga4';
import { useEffect } from 'react';
import Info from './pages/Info';
import GymMembers from './pages/GymMembers';
import ManageGymMembers from './pages/ManageGymMembers';
import ViewGymMember from './pages/ViewGymMember';
import GymReports from './pages/GymReports';
import Inquires from './pages/Inquires';
import ViewInquiry from './pages/ViewInquiry';
import ManageInquires from './pages/ManageInquires';
import PatientSummary from './pages/PatientSummary';
import WellnessSessions from './pages/WellnessSessions';
import WellnessPatients from './pages/WellnessPatients';
import ManageWellnessSessions from './pages/ManageWellnessSessions';
import ViewWellnessSession from './pages/ViewWellnessSession';
import ManageWellnessPatients from './pages/ManageWellnessPatients';
import ViewWellnessPatient from './pages/ViewWellnessPatient';
import WellnessPatientSummary from './pages/WellnessPatientSummary';
import WellnessReports from './pages/WellnessReports';
import GotoReviews from './pages/GotoReviews';

setupIonicReact();

process.env.REACT_APP_GOOGLE_TRACKING_ID && ReactGA.initialize(process.env.REACT_APP_GOOGLE_TRACKING_ID);

const App: React.FC = () => {
  useEffect(() => {
    // Send pageview with path
    ReactGA.send({ hitType: "pageview", page: (window.location.pathname + window.location.search) });
  }, []);

  const isSummaryView = window.location.pathname && window.location.pathname.indexOf("summary") >= 0;

  const category = process.env.REACT_APP_CATEGORY || "";

  const isPhysioAdminAccess = (category === "physioadmin") && !isSummaryView
  const isPhysioAccess = ((category === "physio") || (category === "physioadmin")) && !isSummaryView
  const isGymAdminAccess = (category === "gymadmin") && !isSummaryView
  const isGymAccess = ((category === "gym") || (category === "gymadmin")) && !isSummaryView
  const isWellnessAccess = (category === "wellness") && !isSummaryView

  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/">
              <Redirect to="/info" />
            </Route>
            <Route path="/gotoreviews">
              <GotoReviews />
            </Route>
            <Route path="/info">
              <Info />
            </Route>

            {/* Physio */}
            <Route exact path="/sessions">
              <Sessions />
            </Route>
            <Route exact path="/patients">
              <Patients />
            </Route>
            <Route exact path="/managesession">
              <ManageSessions />
            </Route>
            <Route path="/managesession/:id">
              <ManageSessions />
            </Route>
            <Route path="/viewsession/:id">
              <ViewSession />
            </Route>
            <Route exact path="/managepatient">
              <ManagePatients />
            </Route>
            <Route path="/managepatient/:id">
              <ManagePatients />
            </Route>
            <Route path="/viewpatient/:id">
              <ViewPatient />
            </Route>
            <Route path="/patientsummary/:id">
              <PatientSummary />
            </Route>
            <Route path="/physioreports">
              <PhysioReports />
            </Route>

            {/* Gym */}
            <Route exact path="/gymmembers">
              <GymMembers />
            </Route>
            <Route exact path="/managegymmember">
              <ManageGymMembers />
            </Route>
            <Route path="/managegymmember/:id">
              <ManageGymMembers />
            </Route>
            <Route path="/viewgymmember/:id">
              <ViewGymMember />
            </Route>
            <Route exact path="/inquires">
              <Inquires />
            </Route>
            <Route path="/viewinquiry/:id">
              <ViewInquiry />
            </Route>
            <Route exact path="/manageinquires">
              <ManageInquires />
            </Route>
            <Route path="/manageinquires/:id">
              <ManageInquires />
            </Route>
            <Route path="/gymreports">
              <GymReports />
            </Route>

            {/* Wellness */}
            <Route exact path="/wellnesssessions">
              <WellnessSessions />
            </Route>
            <Route exact path="/wellnesspatients">
              <WellnessPatients />
            </Route>
            <Route exact path="/managewellnesssession">
              <ManageWellnessSessions />
            </Route>
            <Route path="/managewellnesssession/:id">
              <ManageWellnessSessions />
            </Route>
            <Route path="/viewwellnesssession/:id">
              <ViewWellnessSession />
            </Route>
            <Route exact path="/managewellnesspatient">
              <ManageWellnessPatients />
            </Route>
            <Route path="/managewellnesspatient/:id">
              <ManageWellnessPatients />
            </Route>
            <Route path="/viewwellnesspatient/:id">
              <ViewWellnessPatient />
            </Route>
            <Route path="/wellnesspatientsummary/:id">
              <WellnessPatientSummary />
            </Route>
            <Route path="/wellnessreports">
              <WellnessReports />
            </Route>
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
            {/* Physio Related Tabs - STARTS */}
            <IonTabButton tab="sessions" href="/sessions" style={{ display: isPhysioAccess ? '' : 'none' }}>
              <IonIcon icon={calendarOutline} />
              <IonLabel>Sessions</IonLabel>
            </IonTabButton>
            <IonTabButton tab="patients" href="/patients" style={{ display: isPhysioAccess ? '' : 'none' }}>
              <IonIcon icon={peopleOutline} />
              <IonLabel>Patients</IonLabel>
            </IonTabButton>
            <IonTabButton tab="physioreports" href="/physioreports" style={{ display: isPhysioAdminAccess ? '' : 'none' }}>
              <IonIcon icon={barChartOutline} />
              <IonLabel>Reports</IonLabel>
            </IonTabButton>
            {/* Physio Related Tabs - ENDS */}

            {/* Gym Related Tabs - STARTS */}
            <IonTabButton tab="gymmembers" href="/gymmembers" style={{ display: isGymAccess ? '' : 'none' }}>
              <IonIcon icon={barbellOutline} />
              <IonLabel>Gym Members</IonLabel>
            </IonTabButton>
            <IonTabButton tab="inquires" href="/inquires" style={{ display: (isGymAccess || isPhysioAccess) ? '' : 'none' }}>
              <IonIcon icon={helpCircleOutline} />
              <IonLabel>Inquries</IonLabel>
            </IonTabButton>
            <IonTabButton tab="gymreports" href="/gymreports" style={{ display: isGymAdminAccess ? '' : 'none' }}>
              <IonIcon icon={barChartOutline} />
              <IonLabel>Reports</IonLabel>
            </IonTabButton>
            {/* Gym Related Tabs - ENDS */}

            {/* Wellness Related Tabs - STARTS */}
            <IonTabButton tab="wellnesssessions" href="/wellnesssessions" style={{ display: isWellnessAccess ? '' : 'none' }}>
              <IonIcon icon={bodyOutline} />
              <IonLabel>WellnessSessions</IonLabel>
            </IonTabButton>
            <IonTabButton tab="wellnesspatients" href="/wellnesspatients" style={{ display: isWellnessAccess ? '' : 'none' }}>
              <IonIcon icon={peopleOutline} />
              <IonLabel>WellnessPatients</IonLabel>
            </IonTabButton>
            <IonTabButton tab="wellnessreports" href="/wellnessreports" style={{ display: isWellnessAccess ? '' : 'none' }}>
              <IonIcon icon={barChartOutline} />
              <IonLabel>Reports</IonLabel>
            </IonTabButton>
            {/* Wellness Related Tabs - ENDS */}

            {/* Remove common tabs from "Summary" view/page */}
            <IonTabButton tab="gotoreviews" href="/gotoreviews" style={{ display: isSummaryView ? 'none' : '' }}>
              <IonIcon icon={medal} />
              <IonLabel>Reviews</IonLabel>
            </IonTabButton>
            <IonTabButton tab="info" href="/info" style={{ display: isSummaryView ? 'none' : '' }}>
              <IonIcon icon={informationCircle} />
              <IonLabel>Info</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  )
};

export default App;
