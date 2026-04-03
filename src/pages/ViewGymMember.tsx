import { IonBackButton, IonBadge, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonNavLink, IonPage, IonProgressBar, IonRefresher, IonRefresherContent, IonTitle, IonToast, IonToolbar, useIonToast } from "@ionic/react";
import { useParams } from 'react-router-dom';
import * as _ from "lodash";
import { formatCurrency, getWelcomeMessage, refreshPage, sendWhatsappMessage, useGymMembersData } from '../utils';
import { alarmOutline, callOutline, copyOutline, logoWhatsapp, mailOutline, pencil, shareOutline } from "ionicons/icons";
import ManageGymMembers from "./ManageGymMembers";
import moment from "moment";
import ProfilePhoto from "../components/ProfilePhoto";
import { RWebShare } from "react-web-share";
import copy from "copy-to-clipboard";

type PageParams = {
    id?: string;
};

const ViewGymMember: React.FC = () => {
    const { id } = useParams<PageParams>();

    const title = "GymMember Detail"

    const category = process.env.REACT_APP_CATEGORY || "";
    const isGymAdminAccess = (category === "gymadmin")

    const { data, error, isFetching } = useGymMembersData(
        process.env.REACT_APP_GOOGLE_API_KEY || "",
        process.env.REACT_APP_GOOGLE_SHEETS_ID || "",
    );

    const filteredGymMember = data && data.length > 0 && _.filter(data, { "🔒 Row ID": id })
    const currentGymMember: any = (filteredGymMember && filteredGymMember.length > 0) ? filteredGymMember[0] : {}

    const daysRemaining = currentGymMember && moment(currentGymMember["Ending Date"], 'DD-MMM-YYYY').diff(moment(), "hours")
    let membershipStatus = "primary";
    if (daysRemaining <= 0) membershipStatus = "danger";
    else if (daysRemaining <= 10 * 24) membershipStatus = "warning";
    else if (daysRemaining <= 30 * 24) membershipStatus = "secondary"

    const [present] = useIonToast();
    const postCopyToClipboard = (text: any) => {
        copy(text);
        present({
            message: 'Copied to Clipboard',
            duration: 1500,
            position: 'top',
            icon: copyOutline,
            color: 'primary'
        });
    };

    return (
        <IonPage id="main-content">
            <IonHeader translucent={true}>
                <IonToolbar>
                    <IonTitle>{title}</IonTitle>
                    {isFetching && <IonProgressBar type="indeterminate"></IonProgressBar>}
                    <IonButtons slot="start">
                        <IonBackButton defaultHref={"/gymmembers"}></IonBackButton>
                    </IonButtons>
                    <IonButtons slot="end">
                        {currentGymMember["Phone"] &&
                            <IonButton onClick={() => sendWhatsappMessage(`+91${currentGymMember["Phone"]}`, getWelcomeMessage(currentGymMember))}>
                                <IonIcon icon={logoWhatsapp} />
                            </IonButton>
                        }
                        <RWebShare
                            data={{
                                text: getWelcomeMessage(currentGymMember),
                                url: "https://aastha-health.business.site/",
                                title: "Send Gym Membership Details",
                            }}
                            onClick={() => console.log("shared successfully!")}
                        >
                            <IonButton>
                                <IonIcon slot="icon-only" icon={shareOutline} ></IonIcon>
                            </IonButton>
                        </RWebShare>
                        <IonNavLink component={() => <ManageGymMembers />} routerDirection={"forward"}>
                            <IonButton href={`/managegymmember/${id}`}>
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
                    <IonCard style={{ textAlign: "center", paddingTop: "1rem" }}>
                        <ProfilePhoto url={currentGymMember["Profile Photo"]} title={currentGymMember["Name"]} />
                        <IonCardHeader>
                            <IonCardTitle>{currentGymMember["Name"]}</IonCardTitle>
                            {currentGymMember["Email"] &&
                                <IonCardSubtitle>
                                    {currentGymMember["Email"]}
                                    <IonButton href={`mailto:${currentGymMember["Email"]}`} fill="clear" size="small">
                                        <IonIcon slot="icon-only" icon={mailOutline}></IonIcon>
                                    </IonButton>
                                    <IonButton fill="clear" size="small" color={'medium'} onClick={() => postCopyToClipboard(currentGymMember["Email"])}>
                                        <IonIcon slot="icon-only" icon={copyOutline}></IonIcon>
                                    </IonButton>
                                </IonCardSubtitle>
                            }
                            {currentGymMember["Phone"] &&
                                <IonCardSubtitle>
                                    {currentGymMember["Phone"]}
                                    <IonButton href={`tel:${currentGymMember["Phone"]}`} fill="clear" size="small">
                                        <IonIcon slot="icon-only" icon={callOutline}></IonIcon>
                                    </IonButton>
                                    <IonButton fill="clear" size="small" color={'medium'} onClick={() => postCopyToClipboard(currentGymMember["Phone"])}>
                                        <IonIcon slot="icon-only" icon={copyOutline}></IonIcon>
                                    </IonButton>
                                </IonCardSubtitle>
                            }
                        </IonCardHeader>

                        <IonCardContent>
                            <IonItem>
                                <IonLabel color={"medium"}>Joining Date: </IonLabel>
                                <IonLabel>{currentGymMember["Joining Date"]}</IonLabel>
                            </IonItem>

                            <IonItem>
                                <IonLabel color={"medium"}>Ending Date: </IonLabel>
                                <IonLabel>{currentGymMember["Ending Date"]}</IonLabel>
                            </IonItem>

                            <IonItem>
                                <IonLabel color={"medium"}>Payment Mode: </IonLabel>
                                <IonLabel>{currentGymMember["Payment Mode"]}</IonLabel>
                            </IonItem>

                            <IonCard>
                                <IonCardSubtitle>
                                    <IonIcon icon={alarmOutline}></IonIcon>
                                    <IonLabel>{`  Reminders`}</IonLabel>
                                </IonCardSubtitle>
                                <IonItem>
                                    <IonBadge>1</IonBadge>
                                    <IonLabel slot="end">{currentGymMember["Reminder-1"]}</IonLabel>
                                </IonItem>
                                <IonItem>
                                    <IonBadge color={'warning'}>2</IonBadge>
                                    <IonLabel slot="end">{currentGymMember["Reminder-2"]}</IonLabel>
                                </IonItem>
                                <IonItem>
                                    <IonBadge color={'danger'}>3</IonBadge>
                                    <IonLabel slot="end">{currentGymMember["Reminder-3"]}</IonLabel>
                                </IonItem>
                            </IonCard>

                            <IonList>
                                <IonCard color={membershipStatus} style={{ padding: '1rem' }}>
                                    <IonCardSubtitle>Membership {daysRemaining <= 0 ? 'Ended' : 'Ending'}</IonCardSubtitle>
                                    <IonLabel><h1>{moment(currentGymMember["Ending Date"]).fromNow()}</h1></IonLabel>
                                </IonCard>
                            </IonList>
                            {isGymAdminAccess && <IonList>
                                <IonItem>
                                    <IonLabel>Total Amount Received:</IonLabel>
                                    <IonBadge slot="end" color={"success"}>{formatCurrency(currentGymMember["Amount Received"] || 0)}</IonBadge>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Total Amount Pending:</IonLabel>
                                    <IonBadge slot="end" color={"danger"}>{formatCurrency(currentGymMember["Amount Pending"] || 0)}</IonBadge>
                                </IonItem>
                            </IonList>
                            }
                        </IonCardContent>
                    </IonCard>
                </>
            </IonContent>
        </IonPage>
    );
}

export default ViewGymMember;