import { IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonNavLink, IonPage, IonProgressBar, IonRefresher, IonRefresherContent, IonTitle, IonToast, IonToolbar } from "@ionic/react";
import { useParams } from 'react-router-dom';
import * as _ from "lodash";
import { refreshPage, useDataFromGoogleSheet } from '../utils';
import { pencil } from "ionicons/icons";
import WellnessPatientList from "../components/WellnessPatientList";
import ManageWellnessSessions from "./ManageWellnessSessions";

type PageParams = {
    id?: string;
};

const ViewWellnessSession: React.FC = () => {
    const { id } = useParams<PageParams>();
    const fromPatientID = new URLSearchParams(window.location.search).get("fromPatientID")

    const title = "Wellness Session Details"

    const { data, error, isFetching } = useDataFromGoogleSheet(
        process.env.REACT_APP_GOOGLE_API_KEY || "",
        process.env.REACT_APP_GOOGLE_SHEETS_ID || "",
        [],
    );

    const sessionsData = _.filter(data, { id: "WellnessSessions" });
    const patientsData = _.filter(data, { id: "WellnessPatients" });

    const filteredSession = sessionsData && sessionsData.length > 0 && _.filter(sessionsData[0].data, { "🔒 Row ID": id })
    const currentSession: any = (filteredSession && filteredSession.length > 0) ? filteredSession[0] : {}

    const filteredPatient = currentSession && patientsData && patientsData.length > 0 && _.filter(patientsData[0].data, { "🔒 Row ID": currentSession["Patient ID"] })
    const currentPatient: any = (filteredPatient && filteredPatient.length > 0) ? filteredPatient[0] : {}

    return (
        <IonPage id="main-content">
            <IonHeader translucent={true}>
                <IonToolbar>
                    <IonTitle>{title}</IonTitle>
                    {isFetching && <IonProgressBar type="indeterminate"></IonProgressBar>}
                    <IonButtons slot="start">
                        <IonBackButton defaultHref={fromPatientID ? `/viewwellnesspatient/${fromPatientID}` : "/wellnesssessions"}></IonBackButton>
                    </IonButtons>
                    <IonButtons slot="end">
                        <IonNavLink component={() => <ManageWellnessSessions />} routerDirection={"forward"}>
                            <IonButton href={`/managewellnesssession/${id}`}>
                                <IonIcon slot="icon-only" icon={pencil} color="primary"></IonIcon>
                            </IonButton>
                        </IonNavLink>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <>
                    <IonRefresher slot="fixed" onIonRefresh={refreshPage}>
                        <IonRefresherContent></IonRefresherContent>
                    </IonRefresher>
                    <IonToast
                        isOpen={!!error}
                        position={'top'}
                        color={'danger'}
                        message="Error occurred while fetching the details. Please try again !!!"
                        duration={1500}
                    />
                    {error &&
                        <IonItem color={'light'}>
                            <IonLabel color={'danger'}>Error loading data. Please refresh the page to try again !!!</IonLabel>
                        </IonItem>
                    }

                    <IonCard>
                        <IonCardHeader>
                            <IonCardTitle>{currentSession["Report: Patient Name"]}</IonCardTitle>
                            <IonCardSubtitle>{currentSession["Session Date"]}</IonCardSubtitle>
                        </IonCardHeader>

                        <IonCardContent>
                            <IonLabel color={"dark"}><h2 style={{ paddingTop: "0.5rem" }}>Session Description: </h2></IonLabel>
                            <IonLabel>{currentSession["Session Description"]}</IonLabel>

                            <IonLabel color={"dark"}><h2 style={{ paddingTop: "0.5rem" }}>Sittings Used in this Session: </h2></IonLabel>
                            <IonLabel>{currentSession["Sittings Used"]}</IonLabel>
                        </IonCardContent>
                    </IonCard>

                    <IonLabel><h1 style={{ padding: "1rem 1rem 0 1rem" }}>View Patient Details</h1></IonLabel>
                    <WellnessPatientList allPatients={[currentPatient]} fromSessionID={id} isShowDescription />
                </>
            </IonContent>
        </IonPage>
    );
}

export default ViewWellnessSession;