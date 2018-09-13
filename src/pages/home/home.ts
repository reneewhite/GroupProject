import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Slides,LoadingController, AlertController, ToastController  } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { User } from '../../model/user';
import { ProfileProvider } from '../../providers/profile/profile';
declare var firebase;
@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage {
  user:User;
  //form groups 
  logInForm: FormGroup;
  registerForm : FormGroup;
  loading: any;
  googleResponse : any;
  counter = 0;

  //slides
  @ViewChild(Slides) slides: Slides;


  constructor(private alertCtrl: AlertController,public toastCtrl: ToastController, 
    public navCtrl: NavController, public navParams: NavParams, private fb: FormBuilder,
    public profile: ProfileProvider, public loadingCtrl: LoadingController) {

    //log in formgroup
    this.logInForm = this.fb.group({
    
      email: new FormControl('', Validators.compose([
        Validators.maxLength(25),
        Validators.minLength(5),
        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$'),
        Validators.required
      ])),
      pass: new FormControl('', Validators.compose([
        Validators.minLength(5),
        Validators.required,
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9]+$') //this is for the letters (both uppercase and lowercase) and numbers validation
      ]))
    });


     //register formgroup
    
    this.registerForm = this.fb.group({
      name: new FormControl('', Validators.compose([
        Validators.maxLength(50),
        Validators.minLength(1),
        Validators.required
      ])),
      surname: new FormControl('', Validators.compose([
        Validators.maxLength(50),
        Validators.minLength(1),
        Validators.required
      ])),
      email: new FormControl('', Validators.compose([
        Validators.maxLength(25),
        Validators.minLength(5),
        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$'),
        Validators.required
      ])),
      pass: new FormControl('', Validators.compose([
        Validators.minLength(5),
        Validators.required,
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9]+$') //this is for the letters (both uppercase and lowercase) and numbers validation
      ]))
    });

  }
  toggle(x) {
    if (x) {
      this.slides.slideTo(1, 300)
    } else {
      this.slides.slideTo(0, 300)
    }
  }

  login(){
    this.loading = this.loadingCtrl.create({
      content: 'Signing in, Please wait...'
    });
  
    this.loading.present();

    firebase.auth().signInWithEmailAndPassword(this.logInForm.value.email,this.logInForm.value.pass).then(user => {
     
      this.instatiateUserObj(firebase.auth().currentUser.uid);

    }).catch( err =>{
      console.log(err);
      this.loading.dismiss();
      
    });
  }

  googleSign(){

    this.loading = this.loadingCtrl.create({
      content: 'Signing into your account, Please wait...'
    });
  
    this.loading.present(); 
    var provider = new firebase.auth.GoogleAuthProvider();

    firebase.auth().signInWithPopup(provider).then( user => {
      console.log("signed in");

      var currentUser = new User();
  
      currentUser.setUid(user.user.uid)
      currentUser.setUserName(user.user.displayName);
      currentUser.setEmail(user.user.email);
      currentUser.setProfilePic( user.user.photoURL);
      currentUser.setType("user");
      this.profile.user = currentUser;
      firebase.database().ref('/users/' + (user.user.uid)).set(currentUser);
      this.loading.dismiss();
      this.navCtrl.setRoot('FeedPage');
    }).catch(error => {
      console.log(error.message);
      this.loading.dismiss();
    });
   
  
  }

  register() {
    this.loading = this.loadingCtrl.create({
      content: 'Creating your account, Please wait...'
    });
  
    this.loading.present();

    var user: User;
    user = new User();

    user.setUserName(this.registerForm.value.name + " " + this.registerForm.value.surname );
    user.setEmail(this.registerForm.value.email);
    user.setType("user");
    user.setProfilePic("../assets/imgs/user.svg");
  
    this.profile.user = user;
    
    firebase.auth().createUserWithEmailAndPassword(this.registerForm.value.email, this.registerForm.value.pass).then(data => {
      user.setUid(data.user.uid);
      firebase.database().ref('/users/' + (data.user.uid)).set(user);
      this.loading.dismiss();
      this.navCtrl.setRoot('FeedPage');
    }).catch(err => {
      this.presentToast(err.message);
      this.loading.dismiss();
    });
  }


  instatiateUserObj(key){

    firebase.database().ref('/users/'+ key).on('value', userSnapshot => {
  
      
      this.user = new User();
      this.user.setUid(userSnapshot.val().uid);
      this.user.setEmail(userSnapshot.val().email);
      this.user.setUserName(userSnapshot.val().name);  
      this.user.setType(userSnapshot.val().type);
      this.user.setProfilePic(userSnapshot.val().profilePic);
     
      this.profile.user = this.user;
      console.log(this.user.getType());
      
  
      if(this.user.getType() == "user"){
        console.log("user logged in");
        this.loading.dismiss();
        this.navCtrl.setRoot('FeedPage');
      }else if(this.user.getType() != "user"){
        console.log("user logged in");
        this.loading.dismiss();
        this.navCtrl.setRoot('DashboardPage');
      }

    });
  }

  resetPassword(email){
       
    var auth = firebase.auth();

    auth.sendPasswordResetEmail(email).then( res => {
      this.presentToast("Email Sent, check your email");
      
    }).catch( error => {
      this.presentToast(error.message);      
    });
  }

  presentToast(message) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom'
    });
  
    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });
  
    toast.present();
  }

  showPrompt() {
    let alert = this.alertCtrl.create({
      title: 'Login',
      subTitle : "Reset Password",
      message : "A link to reset your password will be sent to your email",
      inputs: [
        {
          name: 'email',
          placeholder: 'e.g user@mail.com',
          type : "email"
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Reset',
          handler: data => {
            this.resetPassword(data.email);            
          }
        }
      ]
    });
    alert.present();
  }

  //error messages
  validation_messages = {
    'name': [
      { type: 'required', message: 'first name names is required.' },
      { type: 'minlength', message: 'first name must be at least 1 characters long.' },
      { type: 'maxlength', message: 'first name cannot be more than 50 characters long.' }
    ],
    'surname': [
      { type: 'required', message: 'surname is required.' },
      { type: 'minlength', message: 'surname must be at least 1 characters long.' },
      { type: 'maxlength', message: 'surname cannot be more than 50 characters long.' }
    ],
    'email': [
      { type: 'required', message: 'email is required.' },
      { type: 'minlength', message: 'email must be at least 5 characters long.' },
      { type: 'maxlength', message: 'email cannot be more than 25 characters long.' },
      { type: 'pattern', message: 'Your email must contain only numbers and letters.' },
      { type: 'validUsername', message: 'Your email has already been taken.' }
    ],
    'pass': [
      { type: 'required', message: 'Password is required.' }
    ],
    'confirmpass': [
      { type: 'required', message: 'Confirm Password is required.' }
    ],
  };
}
  
