import { IonBackButton, IonButton, IonButtons, IonCol, IonContent, IonDatetime, IonDatetimeButton, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonLoading, IonModal, IonPage, IonProgressBar, IonRefresher, IonRefresherContent, IonRow, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToast, IonToolbar, useIonToast } from '@ionic/react';
import axios from 'axios';
import { saveOutline, thumbsDown, thumbsUp } from 'ionicons/icons';
import _ from 'lodash';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { refreshPage, useDataFromGoogleSheet } from '../utils';

type PageParams = {
  id?: string;
};

const ManagePatients: React.FC = () => {

  //check if the mode is edit or add
  const { id } = useParams<PageParams>();
  let isEdit = false;
  if (id) isEdit = true;

  const title = (isEdit ? "Edit" : "Add") + " Patients";

  const [patientName, setPatientName] = useState("")
  const [startDate, setStartDate] = useState<any>(moment().format())
  const [description, setDescription] = useState("")
  const [phone, setPhone] = useState("")
  const [occupation, setOccupation] = useState("")
  const [referralType, setReferralType] = useState<any>("")
  const [referralDetails, setReferralDetails] = useState<any>("")

  const { data, error, isFetching } = useDataFromGoogleSheet(
    process.env.REACT_APP_GOOGLE_API_KEY || "",
    process.env.REACT_APP_GOOGLE_SHEETS_ID || "",
    [],
  );

  const optionsData = _.filter(data, { id: "Options" });
  const allReferralType = optionsData && optionsData.length > 0 && _.filter(optionsData[0].data, (item: any) => item["Referral Type"])
  const defaultReferralType: any = allReferralType && allReferralType.length > 0 && _.head(allReferralType);

  const patientsData = _.filter(data, { id: "Patients" });
  const filteredPatient = patientsData && patientsData.length > 0 && _.filter(patientsData[0].data, { "🔒 Row ID": id })
  const currentPatient: any = (filteredPatient && filteredPatient.length > 0) ? filteredPatient[0] : {}

  const [present] = useIonToast();
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (!referralType) setReferralType(defaultReferralType && defaultReferralType["Referral Type"]);
    if (isEdit && currentPatient) {
      setPatientName(currentPatient["Name"])
      currentPatient["Start Date"] && setStartDate(moment(currentPatient["Start Date"], "MM/DD/YYYY").format())
      setDescription(currentPatient["Description"])
      setPhone(currentPatient["Phone"])
      setOccupation(currentPatient["Occupation"])
      setReferralType(currentPatient["Referral Type"])
      setReferralDetails(currentPatient["Referral Details"])
    }
  }, [defaultReferralType, currentPatient]);

  const presentToast = (color: any, icon: any, message: any) => {
    present({
      message: message,
      duration: 1500,
      position: 'top',
      icon: icon,
      color: color
    });
  };

  const saveRecord = () => {
    if (!patientName) {
      presentToast('danger', thumbsDown, 'Please select Patient Name...')
      return;
    }
    const requestOptions: any = {
      baseURL: process.env.REACT_APP_API_BASE || '',
      url: `.netlify/functions/patientmgmt`,
      method: 'post',
      params: {
        itemID: id
      },
      data: {
        patientName: patientName,
        startDate: startDate,
        description: description,
        phone: phone,
        occupation: occupation,
        referralType: referralType,
        referralDetails: referralDetails
      },
      withCredentials: false,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };

    setShowLoading(true);
    axios(requestOptions)
      .then(function (response: any) {
        console.log(response);
        presentToast('success', thumbsUp, response?.data?.message || 'Saved Successfully.....');
        setShowLoading(false)
        window.location.href = id ? `/viewpatient/${id}` : "/patients";
      })
      .catch(function (error) {
        console.log(error);
        setShowLoading(false)
        presentToast('danger', thumbsDown, 'Sorry some error occured. Please try again to save.....')
      });
  }

  return (
    <IonPage id="main-content">
      <IonHeader translucent={true}>
        <IonToolbar>
          <IonTitle>{title}</IonTitle>
          {isFetching && <IonProgressBar type="indeterminate"></IonProgressBar>}
          <IonButtons slot="start">
            <IonBackButton defaultHref="/patients"></IonBackButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton fill="clear" color='primary' onClick={saveRecord} disabled={isFetching}>
              Save
              <IonIcon slot="start" icon={saveOutline}></IonIcon>
            </IonButton>
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
          <IonLoading
            isOpen={showLoading}
            onDidDismiss={() => setShowLoading(false)}
            message={'Please wait while the data is being saved...'}
          />
          <IonGrid>
            <IonRow>
              <IonCol>
                <IonLabel>Patient Name</IonLabel>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonInput clearInput={true} style={{ background: "var(--ion-color-light)" }}
                  onIonInput={(e: any) => setPatientName(e.target.value)}
                  value={patientName}
                ></IonInput>
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol>
                <IonLabel>Start Date</IonLabel>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonDatetimeButton datetime="datetime" style={{ background: "var(--ion-color-light)" }}></IonDatetimeButton>
                <IonModal keepContentsMounted={true}>
                  <IonDatetime id="datetime" showDefaultTitle={true} showDefaultButtons={true}
                    onIonChange={(e) => setStartDate(e.detail.value)}
                    value={startDate}
                  >
                    <span slot="title">Start Date</span>
                  </IonDatetime>
                </IonModal>
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol>
                <IonLabel>Description</IonLabel>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonTextarea
                  autoCorrect='true'
                  autoGrow={false}
                  rows={6}
                  placeholder="Enter Patient Description here..."
                  onIonInput={(e: any) => setDescription(e.target.value)}
                  value={description}
                  style={{ background: "var(--ion-color-light)" }} />
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonLabel>Phone</IonLabel>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonInput type='number' clearInput={true} style={{ background: "var(--ion-color-light)" }}
                  onIonInput={(e: any) => setPhone(e.target.value)}
                  value={phone}
                ></IonInput>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonLabel>Occupation</IonLabel>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonInput clearInput={true} style={{ background: "var(--ion-color-light)" }}
                  onIonInput={(e: any) => setOccupation(e.target.value)}
                  value={occupation}
                ></IonInput>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol><IonLabel>Referral Type</IonLabel></IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonSelect interface="action-sheet" interfaceOptions={{ header: "Select Referral Type" }} placeholder="Select Referral Type"
                  value={referralType}
                  onIonChange={(e) => setReferralType(e.detail.value)}
                  style={{ background: "var(--ion-color-light)" }}
                >
                  {allReferralType && allReferralType.map((options: any) => (
                    <IonSelectOption key={options["Referral Type"]} value={options["Referral Type"]}>{options["Referral Type"]}</IonSelectOption>
                  ))}
                </IonSelect>
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol>
                <IonLabel>Referral Details</IonLabel>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonTextarea
                  autoCorrect='true'
                  autoGrow={false}
                  rows={5}
                  style={{ background: "var(--ion-color-light)" }}
                  onIonInput={(e: any) => setReferralDetails(e.target.value)}
                  value={referralDetails}
                  placeholder="Enter Referral Details here..." />
              </IonCol>
            </IonRow>
          </IonGrid>
        </>
      </IonContent>
    </IonPage>
  );
};

export default ManagePatients;
