import { storage } from '../firebaseConfig';
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import GoogleSheetsMapper from 'google-sheets-mapper';
import { useQuery } from "react-query";
import axios from 'axios';

export const refreshPage = () => {
    window.location.reload();
}

export const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, }).format(amount)
}

export const uploadFileToFirebase = (pathprefix: any, file: any) => {
    if (!file) return;
    const storageRef = ref(storage, `${pathprefix}/${file.filepath}`);
    return uploadString(storageRef, file.base64Data, 'data_url').then((snapshot) => {
        console.log('Uploaded a base64Data string!', snapshot);
        return getDownloadURL(storageRef)
            .then((url) => {
                console.log("****** downloadURL ", url)
                return url;
            })
    });

}

const appendWriteReviewLink = () => {
    return "\r\n\r\n Your Feedback Matters! Please tell us more about your experience at https://bit.ly/3XSjIjV, so that we can improve our service. "
}

export const getWelcomeMessage = (currentGymMember: any) => {
    const welcomeMesage = `Dear ${currentGymMember["Name"]}, Your Gym Membership details at Aastha Health Plus are: Duration='${currentGymMember["Months"]} month(s)', Joining Date='${currentGymMember["Joining Date"]}' and Ending Date='${currentGymMember["Ending Date"]}'`
    return welcomeMesage+appendWriteReviewLink();
}

export const getPatientWelcomeMessage = (currentPatient: any) => {
    const welcomeMesage = `Dear ${currentPatient["Name"]}, Thanks for choosing Aastha Health Plus (Spine and Rehab) for your wellness journey.\n\nView your details at ${process.env.REACT_APP_URL}patientsummary/${currentPatient["🔒 Row ID"]}`
    return welcomeMesage+appendWriteReviewLink();
}

export const getWellnessPatientWelcomeMessage = (currentPatient: any) => {
    const welcomeMesage = `Dear ${currentPatient["Name"]}, Thanks for choosing Aastha Health Plus (Fitness and Wellness) for your wellness journey.\n\nView your details at ${process.env.REACT_APP_URL}wellnesspatientsummary/${currentPatient["🔒 Row ID"]}`
    return welcomeMesage+appendWriteReviewLink();
}

export const sendWhatsappMessageLive = (mobileNumber: any, message: any) => {
    const requestOptions: any = {
        baseURL: process.env.REACT_APP_API_BASE || '',
        url: `.netlify/functions/sendwhatsapp`,
        method: 'post',
        data: {
            mobileNumber: mobileNumber,
            message: message
        },
        withCredentials: false,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    };

    axios(requestOptions)
        .then(function (response: any) {
            console.log(response);
            // presentToast('success', thumbsUp, response?.data?.message || 'Saved Successfully.....');
            // setShowLoading(false)
            // window.location.href = id ? `/viewsession/${id}` : "/sessions";
        })
        .catch(function (error) {
            console.log(error);
            // setShowLoading(false)
            // presentToast('danger', thumbsDown, 'Sorry some error occured. Please try again to save.....')
        });
}

export const sendWhatsappMessage = (mobileNumber: any, message: any) => {
    // Regex expression to remove all characters which are NOT alphanumeric
    let number = mobileNumber.replace(/[^\w\s]/gi, "").replace(/ /g, "");

    // Appending the phone number to the URL
    let url = `https://api.whatsapp.com/send?phone=${number}`;

    // Appending the message to the URL by encoding it
    url += `&text=${encodeURIComponent(message)}&app_absent=0`;
    // url += `&text=${message}&app_absent=0`;

    // Open our newly created URL in a new tab to send the message
    window.open(url);
};

export function useDataFromGoogleSheet(apiKey: any, sheetId: any, sheetsOptions: any) {
    return useQuery("fulldata", async () => {
        const data = await GoogleSheetsMapper.fetchGoogleSheetsData({
            apiKey,
            sheetId,
            sheetsOptions: sheetsOptions,
        });
        return data;
    }, { staleTime: 5000 })
}

export function useGymMembersData(apiKey: string, sheetId: string) {
    return useQuery("gymMembers", async () => {
        const data = await GoogleSheetsMapper.fetchGoogleSheetsData({
            apiKey,
            sheetId,
            sheetsOptions: [{ id: "GymMembers" }],
        });
        return data?.[0]?.data ?? [];
    }, { staleTime: 5 * 60 * 1000 });
}

export function useOptionsData(apiKey: string, sheetId: string) {
    return useQuery("options", async () => {
        const data = await GoogleSheetsMapper.fetchGoogleSheetsData({
            apiKey,
            sheetId,
            sheetsOptions: [{ id: "Options" }],
        });
        return data?.[0]?.data ?? [];
    }, { staleTime: 5 * 60 * 1000 });
}