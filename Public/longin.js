
        const  logBtn = document.getElementById('loginbtn');
        const usName = document.getElementById('Uname');
        const usPass = document.getElementById('pass');
        logBtn.addEventListener('click',(evt)=>{
          console.log(usName.value);
          let request = new XMLHttpRequest();
          request.open('POST','/');
          request.setRequestHeader('Content-Type','application/json;charset=UTF-8');
          request.responseType = "json";
          request.onload= function(evt){
                if (request.status==200){
                    let res= request.response;
                    console.log(res);
                    if(res.text){
                      window.location= res.location;
                    }
                    else{
                      window.alert(res.msg);
                    }
                    
                }
                else{
                    console.log("err",request);
                }
                };
          let obj={
            text:'Please let me in!',
            user:usName.value,
            pass:usPass.value
          };
          request.send(JSON.stringify(obj));
          
        });

