import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent, IonButton, IonIcon, IonItem, IonLabel, IonNavLink, IonRefresher, IonRefresherContent, IonToast, IonItemDivider, IonItemGroup, IonSearchbar, IonProgressBar, IonBadge, IonSegment, IonSegmentButton } from '@ionic/react';
import { add, calendar, cloudOffline, person } from 'ionicons/icons';
import * as _ from "lodash";
import { refreshPage, useGymMembersData } from '../utils';
import ListLoadingSkeleton from '../components/ListLoadingSkeleton';
import { useMemo, useState } from 'react';
import GymMemberList from '../components/GymMemberList';
import moment from 'moment';
import ManageGymMembers from './ManageGymMembers';

const GymMembers: React.FC = () => {
  const title = "Gym Members"

  const { status, data, error, isFetching } = useGymMembersData(
    process.env.REACT_APP_GOOGLE_API_KEY || "",
    process.env.REACT_APP_GOOGLE_SHEETS_ID || "",
  );
  const loading = (status === "loading");

  let [query, setQuery] = useState("");

  const handleChange = (ev: Event) => {
    let q = "";
    const target = ev.target as HTMLIonSearchbarElement;
    if (target) q = target.value!.toLowerCase();
    setQuery(q)
  }

  const [groupByValue, setGroupByValue] = useState<any>("Months");

  const sortedMembers = useMemo(() => {
    if (!data || data.length === 0) return [];
    return _.orderBy(data, (item: any) => moment(item["Ending Date"], "DD-MMM-YYYY"));
  }, [data]);

  const filteredMembers = useMemo(() => {
    if (!query) return sortedMembers;
    return _.filter(sortedMembers, (item: any) =>
      item["Name"] && item["Name"].toLowerCase().indexOf(query) > -1
    );
  }, [sortedMembers, query]);

  const groupedMembers = useMemo(() => {
    if (!filteredMembers || filteredMembers.length === 0) return {};
    if (groupByValue === 'Inactive') {
      const inactiveMembers = _.filter(filteredMembers, (item: any) =>
        moment(item["Ending Date"], "DD-MMM-YYYY") < moment()
      );
      return _.groupBy(inactiveMembers, (item: any) => item["Name"].charAt(0).toUpperCase());
    }
    const activeMembers = _.filter(filteredMembers, (item: any) =>
      moment(item["Ending Date"], "DD-MMM-YYYY") >= moment()
    );
    if (groupByValue === 'Name') {
      return _.groupBy(activeMembers, (item: any) => item["Name"].charAt(0).toUpperCase());
    }
    return _.groupBy(activeMembers, (item: any) => _.toNumber(item["Months"] || 0));
  }, [filteredMembers, groupByValue]);

  const sortedGroupKeys = useMemo(() =>
    _.orderBy(Object.keys(groupedMembers), (item: any) =>
      groupByValue === 'Months' ? _.toNumber(item) : item
    ), [groupedMembers, groupByValue]);

  return (
    <IonPage id="main-content">
      <IonHeader translucent={true}>
        <IonToolbar>
          <IonTitle>{title}</IonTitle>
          {isFetching && <IonProgressBar type="indeterminate"></IonProgressBar>}
          <IonButtons slot="start">
            <IonMenuButton color="primary"></IonMenuButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonNavLink component={() => <ManageGymMembers />} routerDirection={"forward"}>
              <IonButton href='/managegymmember'>
                <IonIcon slot="icon-only" icon={add} color="primary"></IonIcon>
              </IonButton>
            </IonNavLink>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar animated={true} showClearButton="focus" placeholder="Search" onIonChange={(ev) => handleChange(ev)}></IonSearchbar>
        </IonToolbar>
        <IonToolbar>
          <IonSegment color="primary" value={groupByValue} onIonChange={(e) => setGroupByValue(e.detail.value)}>
            <IonSegmentButton value={'Months'}>
              <IonIcon icon={calendar}></IonIcon>
            </IonSegmentButton>
            <IonSegmentButton value={'Name'}>
              <IonIcon icon={person}></IonIcon>
            </IonSegmentButton>
            <IonSegmentButton value={'Inactive'}>
              InActive
              <IonIcon icon={cloudOffline}></IonIcon>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <>
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

          {sortedGroupKeys && _.map(sortedGroupKeys, (months: any) => (
            <IonItemGroup key={months}>
              <IonItemDivider color="primary" style={{ padding: '0.5rem 1rem', margin: '1rem 0' }}>
                <IonLabel>{months} {groupByValue === 'Months' && `Month(s)`}</IonLabel>
                <IonBadge color={'warning'} slot="end">{groupedMembers ? groupedMembers[months].length : 0}</IonBadge>
              </IonItemDivider>
              <GymMemberList allGymMembers={groupedMembers && groupedMembers[months]} />
            </IonItemGroup>
          ))}
          {sortedGroupKeys && sortedGroupKeys.length <= 0 && <IonItem><IonLabel color={'primary'}>No Data Found</IonLabel></IonItem>}
        </>
      </IonContent>
    </IonPage>
  );
};

export default GymMembers;
