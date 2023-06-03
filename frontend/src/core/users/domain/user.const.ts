export const CHECK_EMPTY = 1;

export const userVar = {
  USER_NAME_MIN_LEN: 3,
  USER_NAME_MAX_LEN: 39,
  PASSWORD_MIN_LEN: 8,
  PASSWORD_MAX_LEN: 32,
  USER_EMAIL_MAX_LEN: 320,
};

export const userMsg = {
  UNKNOWN_ERROR:
    '알 수 없는 오류로 요청을 처리할 수 없습니다. 증상이 반복되면 관리자에게 이메일로 문의하거나 Github Issue에 증상을 남겨주세요.',

  // Login
  EMPTY_USER_EMAIL: '이메일 주소를 입력해주세요.',
  EMPTY_USER_PASSWORD: '비밀번호를 입력해주세요.',
  SUCCESS_USER_LOGIN: '로그인에 성공했습니다.',

  // Login - Error
  NO_MATCHING_ACCOUNT: '일치하는 메일 정보가 없습니다.',
  UNAUTHORIZED_PASSWORD: '비밀번호가 일치하지 않습니다.',

  // Logout
  ERROR_USER_LOGOUT: '로그아웃 중 문제가 발생했습니다.',

  // Authorization
  INVALID_TOKEN:
    '로그인 정보가 없어 타이머와 루틴을 불러올 수 없습니다.<br>타이머와 루틴 정보를 저장하시려면 로그인 후 이용해주세요.',
  INVALID_LOGIN_DATA: '로그인 정보가 유효하지 않습니다. 다시 로그인 해주세요.',

  // Signup
  INVALID_USER_EMAIL: '유효하지 않은 이메일 형식입니다.',
  BELOW_MIN_USER_NAME: `유저네임을 ${userVar.USER_NAME_MIN_LEN}글자 이상으로 설정해주세요`,
  BELOW_MIN_USER_PASSWORD: `비밀번호를 ${userVar.PASSWORD_MIN_LEN}자 이상으로 설정해주세요.`,
  ABOVE_MAX_USER_PASSWORD: `비밀번호를 ${userVar.PASSWORD_MAX_LEN}자 미만으로 설정해주세요.`,
  EMPTY_CONFIRM_PASSWORD: '비밀번호를 한번 더 입력해주세요.',
  MISMATCH_PASSWORD: '비밀번호가 일치하지 않습니다.',
  SEND_USER_SIGNUP_VERIFICATION_EMAIL:
    '로 인증 메일이 전송됐습니다. 메일을 확인해주세요.',

  // Email verification
  VERIFY_USER_EMAIL: '인증 코드를 입력해주세요.',
  VERIFY_EMAIL_SUCCESS: '인증되었습니다. 서비스를 이용하시려면 로그인해주세요.',
  INVALID_EMAIL_VERIFICATION_CODE: '유효하지 않은 인증정보입니다.',
  ALREADY_VERIFIED_EMAIL: '이미 인증된 계정입니다.',

  // Password reset verification
  VERIFY_RESET_PASSWORD_SUCCESS:
    '인증되었습니다. 변경할 비밀번호를 입력해주세요.',
  RESET_PASSWORD_SUCCESS: '비밀번호 재설정을 완료했습니다.',

  // Change email verification
  SAME_NEW_EMAIL:
    '입력한 이메일이 현재 사용 중인 이메일과 일치합니다. 다른 이메일을 입력해주세요.',
  CHANGE_EMAIL_SUCCESS: '이메일이 변경됐습니다.',

  // Change name verification
  SAME_NEW_USERNAME:
    '입력한 유저네임이 현재 사용 중인 유저네임과 일치합니다. 다른 유저네임을 입력해주세요.',
  PROFANE_WORDS: '사용 불가능한 단어가 포함되어 있습니다.',
  CHANGE_USERNAME_SUCCESS: '유저네임을 변경했습니다.',

  // Delete account success
  DELETE_ACCOUNT_SUCCESS: '회원 탈퇴되었습니다.',
};
