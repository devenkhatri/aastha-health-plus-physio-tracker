import { IonItemSliding, IonItem, IonAvatar, IonLabel, IonItemOptions, IonItemOption, IonIcon, IonList } from "@ionic/react";
import { createOutline } from "ionicons/icons";
import Avatar from "react-avatar";

const GymMemberList = ({ allGymMembers }: any) => {    
    // console.log("******* ", allGymMembers)
    return (
        <IonList>
            {allGymMembers && allGymMembers.map((member: any) => (
                <IonItemSliding key={member["🔒 Row ID"]}>
                    <IonItem button={true} key={member["🔒 Row ID"]} detail={true} 
                        href={`/viewgymmember/${member["🔒 Row ID"]}`}     
                        style={{borderLeft: `${member["IsPersonalTraining"]?'3px':'0px'} solid var(--ion-color-secondary)`}}
                    >
                        <IonAvatar slot="start">
                            <Avatar name={member["Name"]} round size="100%" />
                        </IonAvatar>
                        <IonLabel>
                            <h2>{member["Name"]}</h2>
                        </IonLabel>
                        <IonLabel slot="end">{member["Ending Date"]}</IonLabel>
                    </IonItem>

                    <IonItemOptions>
                        <IonItemOption onClick={() => { window.location.href = `/managegymmember/${member["🔒 Row ID"]}` }}>
                            <IonIcon slot="top" icon={createOutline} />
                            Edit
                        </IonItemOption>
                    </IonItemOptions>
                </IonItemSliding>
            ))}            
        </IonList>
    );
}

export default GymMemberList;