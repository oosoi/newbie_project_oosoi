// authCheck.js

// isOwner 함수: 사용자가 로그인되어 있는지 확인하는 함수
function isOwner(request) {
  return request.session && request.session.is_logined;
}

// statusUI 함수: 인증 상태에 따라 UI를 반환하는 함수
function statusUI(request) {
  var authStatusUI = 'Please login';
  if (isOwner(request)) {
    authStatusUI = `Welcome ! Player ${request.session.nickname} | <a href="/auth/logout">로그아웃</a>`;
  }
  return authStatusUI;
}

// 인증 및 메시지 설정 함수
function checkAuth(request, response, redirectUrl, showWelcome = false) {
  if (!isOwner(request)) {
    response.send("<script>alert('Please login '); location.href='/auth/login';</script>");
    return false;
  }
  if (showWelcome) {
    response.send(`<script>alert('Welcome ! Player ${request.session.nickname}'); location.href='${redirectUrl}';</script>`);
    return false;
  }
  return true;
}

// isOwner와 statusUI, checkAuth 함수를 외부에서 사용할 수 있도록 모듈에 내보내기
module.exports = {
  isOwner,
  statusUI,
  checkAuth
};
