import { IonBackButton, IonButton, IonButtons, IonCol, IonContent, IonDatetime, IonDatetimeButton, IonFab, IonFabButton, IonFabList, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonLoading, IonModal, IonPage, IonProgressBar, IonRefresher, IonRefresherContent, IonRow, IonSelect, IonSelectOption, IonTitle, IonToast, IonToggle, IonToolbar, useIonAlert, useIonToast } from '@ionic/react';
import axios from 'axios';
import { camera, image, saveOutline, thumbsDown, thumbsUp, trash } from 'ionicons/icons';
import _ from 'lodash';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProfilePhoto from '../components/ProfilePhoto';
import { usePhotoGallery } from '../hooks/usePhotoGallery';
import { refreshPage, uploadFileToFirebase, useGymMembersData, useOptionsData } from '../utils';

type PageParams = {
  id?: string;
};

const ManageGymMembers: React.FC = () => {

  //check if the mode is edit or add
  const { id } = useParams<PageParams>();
  let isEdit = false;
  if (id) isEdit = true;

  const title = (isEdit ? "Edit" : "Add") + " Gym Members";

  const category = process.env.REACT_APP_CATEGORY || "";
  const isGymAdminAccess = (category === "gymadmin")

  const [name, setName] = useState("")
  const [profilePhoto, setProfilePhoto] = useState<any>()
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [joiningDate, setJoiningDate] = useState<any>(moment().format())
  const [months, setMonths] = useState()
  const [isPersonalTraining, setIsPersonalTraining] = useState("")
  const [paymentMode, setPaymentMode] = useState("")
  const [amountReceived, setAmountReceived] = useState()
  const [amountPending, setAmountPending] = useState()

  const { data: gymMembersRaw, error: gymError, isFetching: gymFetching } = useGymMembersData(
    process.env.REACT_APP_GOOGLE_API_KEY || "",
    process.env.REACT_APP_GOOGLE_SHEETS_ID || "",
  );
  const { data: optionsRaw, error: optionsError, isFetching: optionsFetching } = useOptionsData(
    process.env.REACT_APP_GOOGLE_API_KEY || "",
    process.env.REACT_APP_GOOGLE_SHEETS_ID || "",
  );

  const isFetching = gymFetching || optionsFetching;
  const error = gymError || optionsError;

  const allPaymentModes = optionsRaw && _.filter(optionsRaw, (item: any) => item["Payment Modes"]);
  const defaultPaymentMode: any = allPaymentModes && allPaymentModes.length > 0 && _.head(allPaymentModes);

  const filteredGymMember = gymMembersRaw && gymMembersRaw.length > 0 && _.filter(gymMembersRaw, { "🔒 Row ID": id });
  const currentGymMember: any = (filteredGymMember && filteredGymMember.length > 0) ? filteredGymMember[0] : {};

  const [present] = useIonToast();
  const [showLoading, setShowLoading] = useState(false);
  const [presentAlert] = useIonAlert();

  const { photos, takePhoto, deletePhoto } = usePhotoGallery();

  useEffect(() => {
    if (!paymentMode) setPaymentMode(defaultPaymentMode && defaultPaymentMode["Payment Modes"]);
    if (isEdit && currentGymMember) {
      setName(currentGymMember["Name"])
      setProfilePhoto(currentGymMember["Profile Photo"])
      setEmail(currentGymMember["Email"])
      setPhone(currentGymMember["Phone"])
      currentGymMember["Joining Date"] && setJoiningDate(moment(currentGymMember["Joining Date"], "DD-MMM-YYYY").format())
      setMonths(currentGymMember["Months"])
      setPhone(currentGymMember["Phone"])
      setIsPersonalTraining(currentGymMember["IsPersonalTraining"])
      setPaymentMode(currentGymMember["Payment Mode"])
      setAmountReceived(currentGymMember["Amount Received"])
      setAmountPending(currentGymMember["Amount Pending"])
    }
  }, [defaultPaymentMode, currentGymMember]);

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

    if (!name) {
      presentToast('danger', thumbsDown, 'Please enter Member Name...')
      return;
    }
    if (!joiningDate) {
      presentToast('danger', thumbsDown, 'Please select Joining Date...')
      return;
    }
    if (!months) {
      presentToast('danger', thumbsDown, 'Please enter membership Months...')
      return;
    }

    setShowLoading(true);

    const uploadedPhotoUrl = await uploadPhoto();

    console.log("******* uploaded image URL ", uploadedPhotoUrl)

    const requestOptions: any = {
      baseURL: process.env.REACT_APP_API_BASE || '',
      url: `.netlify/functions/gymmembermgmt`,
      method: 'post',
      params: {
        itemID: id
      },
      data: {
        name: name,
        profilePhoto: uploadedPhotoUrl,
        email: email,
        phone: phone,
        joiningDate: joiningDate,
        months: months || 0,
        isPersonalTraining: isPersonalTraining ? 'Yes' : '',
        paymentMode: paymentMode,
        amountReceived: amountReceived || 0,
        amountPending: amountPending || 0,
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
        window.location.href = id ? `/viewgymmember/${id}` : "/gymmembers";
      })
      .catch(function (error) {
        console.log(error);
        setShowLoading(false)
        presentToast('danger', thumbsDown, 'Sorry some error occured. Please try again to save.....')
      });
  }

  const uploadPhoto = async () => {
    return await uploadFileToFirebase('gymmembers', photos && photos.length > 0 && photos[0])
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
            <IonBackButton defaultHref={id ? `/viewgymmember/${id}` : "/gymmembers"}></IonBackButton>
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
              <IonFabButton color={'secondary'} onClick={() => takePhoto(name)}>
                <IonIcon icon={camera}></IonIcon>
              </IonFabButton>
              {(profilePhoto || (photos && photos.length > 0)) && <IonFabButton color={'danger'} onClick={() => removePhoto()}>
                <IonIcon icon={trash}></IonIcon>
              </IonFabButton>
              }
            </IonFabList>

          </IonFab>
          <ProfilePhoto url={profilePhoto || (photos && photos.length > 0 && photos[0].webviewPath)} title={name} />
          <IonGrid>
            <IonRow>
              <IonCol>
                <IonLabel>Name</IonLabel>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonInput clearInput={true} style={{ background: "var(--ion-color-light)" }}
                  onIonInput={(e: any) => setName(e.target.value)}
                  value={name}
                ></IonInput>
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol>
                <IonLabel>Email</IonLabel>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonInput type={'email'} clearInput={true} style={{ background: "var(--ion-color-light)" }}
                  onIonInput={(e: any) => setEmail(e.target.value)}
                  value={email}
                ></IonInput>
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol>
                <IonLabel>Phone</IonLabel>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonInput type={'number'} clearInput={true} style={{ background: "var(--ion-color-light)" }}
                  onIonInput={(e: any) => setPhone(e.target.value)}
                  value={phone}
                ></IonInput>
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol>
                <IonLabel>Joining Date</IonLabel>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonDatetimeButton datetime="datetime" style={{ background: "var(--ion-color-light)" }}></IonDatetimeButton>
                <IonModal keepContentsMounted={true}>
                  <IonDatetime id="datetime" showDefaultTitle={true} showDefaultButtons={true}
                    onIonChange={(e) => setJoiningDate(e.detail.value)}
                    value={joiningDate}
                  >
                    <span slot="title">Joining Date</span>
                  </IonDatetime>
                </IonModal>
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol>
                <IonLabel>Membership (in Months)</IonLabel>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonInput type={'number'} clearInput={true} style={{ background: "var(--ion-color-light)" }}
                  onIonInput={(e: any) => setMonths(e.target.value)}
                  value={months}
                  placeholder="0"
                ></IonInput>
              </IonCol>
            </IonRow>
            {isGymAdminAccess &&
              <>
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
                    <IonLabel>Amount Received</IonLabel>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol>
                    <IonInput type='number' clearInput={true} style={{ background: "var(--ion-color-light)" }}
                      onIonInput={(e: any) => setAmountReceived(e.target.value)}
                      value={amountReceived}
                      placeholder="0"
                    ></IonInput>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol>
                    <IonLabel>Amount Pending</IonLabel>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol>
                    <IonInput type='number' clearInput={true} style={{ background: "var(--ion-color-light)" }}
                      onIonInput={(e: any) => setAmountPending(e.target.value)}
                      value={amountPending}
                      placeholder="0"
                    ></IonInput>
                  </IonCol>
                </IonRow>
              </>
            }

            <IonRow>
              <IonCol>
                <IonLabel>isPersonalTraining</IonLabel>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonToggle checked={!!isPersonalTraining} onIonChange={(e: any) => setIsPersonalTraining(e.detail.checked ? 'Yes' : '')}></IonToggle>
              </IonCol>
            </IonRow>

          </IonGrid>
        </>
      </IonContent>
    </IonPage>
  );
};

export default ManageGymMembers;
