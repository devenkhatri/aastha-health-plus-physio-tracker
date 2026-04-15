import { IonBackButton, IonButton, IonButtons, IonCol, IonContent, IonDatetime, IonDatetimeButton, IonFab, IonFabButton, IonFabList, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonLoading, IonModal, IonPage, IonProgressBar, IonRefresher, IonRefresherContent, IonRow, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToast, IonToolbar, useIonAlert, useIonToast } from '@ionic/react';
import axios from 'axios';
import { camera, image, saveOutline, thumbsDown, thumbsUp, trash } from 'ionicons/icons';
import _ from 'lodash';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { refreshPage, uploadFileToFirebase, useDataFromGoogleSheet } from '../utils';
import { usePhotoGallery } from '../hooks/usePhotoGallery';
import ProfilePhoto from '../components/ProfilePhoto';

type PageParams = {
  id?: string;
};

const ManageWellnessPatients: React.FC = () => {

  //check if the mode is edit or add
  const { id } = useParams<PageParams>();
  let isEdit = false;
  if (id) isEdit = true;

  const title = (isEdit ? "Edit" : "Add") + " Wellness Patient";

  const [patientName, setPatientName] = useState("")
  const [profilePhoto, setProfilePhoto] = useState<any>()
  const [startDate, setStartDate] = useState<any>(moment().format())
  const [description, setDescription] = useState("")
  const [phone, setPhone] = useState("")
  const [occupation, setOccupation] = useState("")
  const [referralType, setReferralType] = useState<any>("")
  const [referralDetails, setReferralDetails] = useState<any>("")
  const [totalSessions, setTotalSessions] = useState<any>(1)
  const [totalCharges, setTotalCharges] = useState<any>(0)
  const [paymentMode, setPaymentMode] = useState("")
  const [treatmentType, setTreatmentType] = useState("")

  const { data, error, isFetching } = useDataFromGoogleSheet(
    process.env.REACT_APP_GOOGLE_API_KEY || "",
    process.env.REACT_APP_GOOGLE_SHEETS_ID || "",
    [],
  );

  const optionsData = _.filter(data, { id: "Options" });
  const allReferralType = optionsData && optionsData.length > 0 && _.filter(optionsData[0].data, (item: any) => item["Referral Type"])
  const defaultReferralType: any = allReferralType && allReferralType.length > 0 && _.head(allReferralType);

  const allPaymentModes = optionsData && optionsData.length > 0 && _.filter(optionsData[0].data, (item: any) => item["Payment Modes"])
  const defaultPaymentMode: any = allPaymentModes && allPaymentModes.length > 0 && _.head(allPaymentModes);

  const allTreatmentTypes = optionsData && optionsData.length > 0 && _.filter(optionsData[0].data, (item: any) => item["Wellness Types"])
  const defaultTreatmentType: any = allTreatmentTypes && allTreatmentTypes.length > 0 && _.head(allTreatmentTypes);

  const patientsData = _.filter(data, { id: "WellnessPatients" });
  const filteredPatient = patientsData && patientsData.length > 0 && _.filter(patientsData[0].data, { "🔒 Row ID": id })
  const currentPatient: any = (filteredPatient && filteredPatient.length > 0) ? filteredPatient[0] : {}

  const [present] = useIonToast();
  const [showLoading, setShowLoading] = useState(false);
  const [presentAlert] = useIonAlert();

  const { photos, takePhoto, deletePhoto } = usePhotoGallery();

  useEffect(() => {
    if (!referralType) setReferralType(defaultReferralType && defaultReferralType["Referral Type"]);
    if (isEdit && currentPatient) {
      setPatientName(currentPatient["Name"])
      setProfilePhoto(currentPatient["Profile Photo"])
      currentPatient["Start Date"] && setStartDate(moment(currentPatient["Start Date"], "MM/DD/YYYY").format())
      setDescription(currentPatient["Treatment Description"])
      setPhone(currentPatient["Phone"])
      setOccupation(currentPatient["Occupation"])
      setReferralType(currentPatient["Referral Type"])
      setReferralDetails(currentPatient["Referral Details"])
      setTotalSessions(currentPatient["Treatment Total Sittings"])
      setTotalCharges(currentPatient["Treatment Total Charges"])
      if (!paymentMode) setPaymentMode(currentPatient["Payment Mode"])
      if (!treatmentType) setTreatmentType(currentPatient["Treatment Type"])
    }
    if (!isEdit && !paymentMode) setPaymentMode(defaultPaymentMode && defaultPaymentMode["Payment Modes"]);
    if (!isEdit && !treatmentType) setTreatmentType(defaultTreatmentType && defaultTreatmentType["Treatment Type"]);
  }, [paymentMode, defaultPaymentMode, treatmentType, defaultTreatmentType, defaultReferralType, currentPatient]);

  const presentToast = (color: any, icon: any, message: any) => {
    present({
      message: message,
      duration: 1500,
      position: 'top',
      icon: icon,
      color: color
    });
  };

  const saveRecord = async () => {
    if (!patientName) {
      presentToast('danger', thumbsDown, 'Please select Patient Name...')
      return;
    }

    setShowLoading(true);

    const uploadedPhotoUrl = await uploadPhoto();

    console.log("******* uploaded image URL ", uploadedPhotoUrl)

    const requestOptions: any = {
      baseURL: process.env.REACT_APP_API_BASE || '',
      url: `.netlify/functions/wellnesspatientmgmt`,
      method: 'post',
      params: {
        itemID: id
      },
      data: {
        patientName: patientName,
        profilePhoto: uploadedPhotoUrl,
        startDate: startDate,
        description: description,
        totalSessions: totalSessions,
        totalCharges: totalCharges,
        paymentMode: paymentMode,
        phone: phone,
        occupation: occupation,
        referralType: referralType,
        referralDetails: referralDetails,
        treatmentType: treatmentType,
      },
      withCredentials: false,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };

    axios(requestOptions)
      .then(function (response: any) {
        console.log(response);
        presentToast('success', thumbsUp, response?.data?.message || 'Saved Successfully.....');
        setShowLoading(false)
        window.location.href = id ? `/viewwellnesspatient/${id}` : "/wellnesspatients";
      })
      .catch(function (error) {
        console.log(error);
        setShowLoading(false)
        presentToast('danger', thumbsDown, 'Sorry some error occured. Please try again to save.....')
      });
  }


  const uploadPhoto = async () => {
    return await uploadFileToFirebase('wellnesspatient', photos && photos.length > 0 && photos[0])
  }

  const removePhoto = () => {
    presentAlert({
      header: 'Alert',
      subHeader: 'Are you sure, you want to remove this profile photo?',
      buttons: [
        {
          text: 'Cancel',
        },
        {
          text: 'OK',
          role: 'confirm',
          handler: () => {
            photos && photos.map((photo: any) => deletePhoto(photo));
            setProfilePhoto(null);
            // set
          },
        },
      ],
    })
  }


  return (
    <IonPage id="main-content">
      <IonHeader translucent={true}>
        <IonToolbar>
          <IonTitle>{title}</IonTitle>
          {isFetching && <IonProgressBar type="indeterminate"></IonProgressBar>}
          <IonButtons slot="start">
            <IonBackButton defaultHref="/wellnesspatients"></IonBackButton>
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
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton>
              <IonIcon icon={image}></IonIcon>
            </IonFabButton>
            <IonFabList side="top">
              <IonFabButton color={'secondary'} onClick={() => takePhoto(patientName)}>
                <IonIcon icon={camera}></IonIcon>
              </IonFabButton>
              {(profilePhoto || (photos && photos.length > 0)) && <IonFabButton color={'danger'} onClick={() => removePhoto()}>
                <IonIcon icon={trash}></IonIcon>
              </IonFabButton>
              }
            </IonFabList>

          </IonFab>
          <ProfilePhoto url={profilePhoto || (photos && photos.length > 0 && photos[0].webviewPath)} title={patientName} />
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
              <IonCol><IonLabel>Treatment Type</IonLabel></IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonSelect interface="action-sheet" interfaceOptions={{ header: "Select Treatment Type" }} placeholder="Select Treatment Type"
                  value={treatmentType}
                  onIonChange={(e) => setTreatmentType(e.detail.value)}
                  style={{ background: "var(--ion-color-light)" }}
                >
                  {allTreatmentTypes && allTreatmentTypes.map((options: any) => (
                    <IonSelectOption key={options["Wellness Types"]} value={options["Wellness Types"]}>{options["Wellness Types"]}</IonSelectOption>
                  ))}
                </IonSelect>
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
                <IonLabel>Treatment Description</IonLabel>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonTextarea
                  autoCorrect='true'
                  autoGrow={true}
                  placeholder="Enter Treatment Description here..."
                  onIonInput={(e: any) => setDescription(e.target.value)}
                  value={description}
                  style={{ background: "var(--ion-color-light)" }} />
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonLabel>Treatment Total Sittings</IonLabel>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonInput type='number' clearInput={true} style={{ background: "var(--ion-color-light)" }}                  
                  onIonInput={(e: any) => setTotalSessions(e.target.value)}
                  value={totalSessions}
                ></IonInput>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonLabel>Treatment Total Charges</IonLabel>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonInput type='number' clearInput={true} style={{ background: "var(--ion-color-light)" }}                  
                  onIonInput={(e: any) => setTotalCharges(e.target.value)}
                  value={totalCharges}
                ></IonInput>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol><IonLabel>Payment Mode</IonLabel></IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonSelect interface="action-sheet" interfaceOptions={{ header: "Select Payment Mode" }} placeholder="Select Payment Mode"
                  value={paymentMode}
                  onIonChange={(e) => setPaymentMode(e.detail.value)}
                  style={{ background: "var(--ion-color-light)" }}
                >
                  {allPaymentModes && allPaymentModes.map((options: any) => (
                    <IonSelectOption key={options["Payment Modes"]} value={options["Payment Modes"]}>{options["Payment Modes"]}</IonSelectOption>
                  ))}
                </IonSelect>
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
                  autoGrow={true}
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

export default ManageWellnessPatients;
