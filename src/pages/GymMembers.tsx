import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent, IonButton, IonIcon, IonItem, IonLabel, IonNavLink, IonRefresher, IonRefresherContent, IonToast, IonItemDivider, IonItemGroup, IonSearchbar, IonProgressBar } from '@ionic/react';
import { add } from 'ionicons/icons';
import useGoogleSheets from 'use-google-sheets';
import * as _ from "lodash";
import { refreshPage } from '../utils';
import ListLoadingSkeleton from '../components/ListLoadingSkeleton';
import { useState } from 'react';
import GymMemberList from '../components/GymMemberList';
import moment from 'moment';
import ManageGymMembers from './ManageGymMembers';

const GymMembers: React.FC = () => {
  const title = "Gym Members"

  const { data, loading, error } = useGoogleSheets({
    apiKey: process.env.REACT_APP_GOOGLE_API_KEY || "",
    sheetId: process.env.REACT_APP_GOOGLE_SHEETS_ID || "",
    sheetsOptions: [],
  });

  const gymMembersData = _.filter(data, { id: "GymMembers" });

  let [query, setQuery] = useState("");

  const handleChange = (ev: Event) => {
    let q = "";
    const target = ev.target as HTMLIonSearchbarElement;
    if (target) q = target.value!.toLowerCase();
    setQuery(q)
  }

  const sortedGymMembers = gymMembersData && gymMembersData.length > 0 && _.orderBy(gymMembersData[0].data, (item: any) => moment(item["Ending Date"],"DD-MMM-YYYY"))
  const filteredGymMembers = sortedGymMembers && query?_.filter(sortedGymMembers, (item: any) => item["Name"] && item["Name"].toLowerCase().indexOf(query) > -1):sortedGymMembers;
  const groupedGymMembers = filteredGymMembers && _.groupBy(filteredGymMembers, (item: any) => _.toNumber(item["Months"] || 0))

  return (
    <IonPage id="main-content">
      <IonHeader translucent={true}>
        <IonToolbar>
          <IonTitle>{title}</IonTitle>
          {loading && <IonProgressBar type="indeterminate"></IonProgressBar> }
          <IonButtons slot="start">
            <IonMenuButton color="primary"></IonMenuButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonNavLink component={() => <ManageGymMembers />} routerDirection={"forward"}>
              <IonButton href='/managegymmembers'>
                <IonIcon slot="icon-only" icon={add} color="primary"></IonIcon>
              </IonButton>
            </IonNavLink>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar animated={true} showClearButton="focus" placeholder="Search" onIonChange={(ev) => handleChange(ev)}></IonSearchbar>
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
        <>
          {groupedGymMembers && _.map(groupedGymMembers, (memberDetails: any, months: any) => (
            <IonItemGroup key={months}>
              <IonItemDivider color="primary" style={{padding: '0.5rem 1rem', margin:'1rem 0'}}>
                <IonLabel>
                  {months} Month(s)
                </IonLabel>
              </IonItemDivider>
              <GymMemberList allGymMembers={memberDetails} />
            </IonItemGroup>
          ))}
        </>
      </IonContent>
    </IonPage>
  );
};

export default GymMembers;