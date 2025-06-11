import { api } from '../services/api';


export const incrementscore = async (data: any = {}) => {
 try {
    if (data && Object.keys(data).length > 0) {
      // Si data existe et n'est pas vide, on l'envoie
      const response = await api.post('/auth/increment-score', data);
      return response.data;
    } else {
      // Sinon, on fait un post sans body
      const response = await api.post('/auth/increment-score');
      return response.data;
    }
  } catch (error: any) {
    console.error("erreur lors de l'incrémentation du score", error);
    throw error.response?.data || { message: "erreur lors de l'incrémentation du score" };
  }
};


// export const verifcaptchavalue=async (challengeid:string,answer:string,client_timestamp:string,proof_of_work:string)=>{
//   try {
//     const data = {
//       challengeid,
//       answer,
//       client_timestamp,
//       proof_of_work
//     };
//     const response = await api.post('/auth/check-human', data);
//     return response.data;
//   } catch (error:any) {
//     console.error("Erreur lors de l'obtention du captcha", error);
//     throw(error.response?.data || {message: "Erreur lors de l'obtention du captcha"});
//   }
// }

export const checkmilestone=async ()=>{
  try {
    const response = await api.get('/auth/check-milestone');
    return response.data;
  } catch (error:any) {
    console.error("Erreur lors de la vérification du jalon", error);
    throw(error.response?.data || {message: "Erreur lors de la vérification du jalon"});
  }
}