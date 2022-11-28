import { IonAvatar, IonBackButton, IonBadge, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonIcon, IonItem, IonItemDivider, IonItemGroup, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonMenuButton, IonNavLink, IonPage, IonRefresher, IonRefresherContent, IonThumbnail, IonTitle, IonToast, IonToolbar } from "@ionic/react";
import { useParams } from 'react-router-dom';
import useGoogleSheets from 'use-google-sheets';
import * as _ from "lodash";
import { refreshPage } from '../utils';
import ListLoadingSkeleton from '../components/ListLoadingSkeleton';
import { add, pencil } from "ionicons/icons";
import ManageSessions from "./ManageSessions";
import Avatar from 'react-avatar';
import ManagePatients from "./ManagePatients";

type PageParams = {
    id?: string;
};

const ViewSession: React.FC = () => {
    const { id } = useParams<PageParams>();
    const fromPatientID = new URLSearchParams(window.location.search).get("fromPatientID")    

    const title = "Session Details"

    const { data, loading, error } = useGoogleSheets({
        apiKey: process.env.REACT_APP_GOOGLE_API_KEY || "",
        sheetId: process.env.REACT_APP_GOOGLE_SHEETS_ID || "",
        sheetsOptions: [],
    });

    const sessionsData = _.filter(data, { id: "Sessions" });
    const patientsData = _.filter(data, { id: "Patients" });

    const filteredSession = sessionsData && sessionsData.length > 0 && _.filter(sessionsData[0].data, { "🔒 Row ID": id })
    const currentSession: any = (filteredSession && filteredSession.length > 0) ? filteredSession[0] : {}

    const filteredPatient = currentSession && patientsData && patientsData.length > 0 && _.filter(patientsData[0].data, { "🔒 Row ID": currentSession["Patient ID"] })
    const currentPatient: any = (filteredPatient && filteredPatient.length > 0) ? filteredPatient[0] : {}

    return (
        <IonPage id="main-content">
            <IonHeader translucent={true}>
                <IonToolbar>
                    <IonTitle>{title}</IonTitle>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref={fromPatientID?`/viewpatient/${fromPatientID}`:"/sessions"}></IonBackButton>
                    </IonButtons>
                    <IonButtons slot="end">
                        <IonNavLink component={() => <ManageSessions />} routerDirection={"forward"}>
                            <IonButton href={`/managesession/${id}`}>
                                <IonIcon slot="icon-only" icon={pencil} color="primary"></IonIcon>
                            </IonButton>
                        </IonNavLink>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonRefresher slot="fixed" onIonRefresh={refreshPage}>
                    <IonRefresherContent></IonRefresherContent>
                </IonRefresher>
                {loading &&
                    <ListLoadingSkeleton />
                }
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
                        <IonLabel color={"dark"}><h2 style={{ paddingTop: "0.5rem" }}>Payment Mode: </h2></IonLabel>
                        <IonLabel>{currentSession["Payment Mode"]}</IonLabel>

                        <IonLabel color={"dark"}><h2 style={{ paddingTop: "0.5rem" }}>Amount Paid: </h2></IonLabel>
                        <IonLabel>{currentSession["Amount Paid"]}</IonLabel>

                        <IonLabel color={"dark"}><h2 style={{ paddingTop: "0.5rem" }}>Amount Pending: </h2></IonLabel>
                        <IonLabel>{currentSession["Amount Pending"]}</IonLabel>

                        <IonLabel color={"dark"}><h2 style={{ paddingTop: "0.5rem" }}>Deposit Amount: </h2></IonLabel>
                        <IonLabel>{currentSession["Deposit Amount"]}</IonLabel>                    
                    </IonCardContent>
                </IonCard>
                
                <IonLabel><h1 style={{ padding: "1rem 1rem 0 1rem" }}>View Patient Details</h1></IonLabel>
                <IonList>
                    <IonNavLink component={() => <ManagePatients />} routerDirection={"forward"}>
                        <IonItem button={true} detail={true} href={`/viewpatient/${currentSession["Patient ID"]}?fromSessionID=${id}`}>
                            <IonAvatar slot="start">
                                <Avatar name={currentSession["Report: Patient Name"]} round size="100%" />
                            </IonAvatar>
                            <IonLabel>
                                <h2>{currentSession["Report: Patient Name"]}</h2>
                                <p>{currentPatient["Description"]}</p>
                            </IonLabel>
                        </IonItem>
                    </IonNavLink>
                </IonList>
            </IonContent>
        </IonPage>
    );
}

export default ViewSession;