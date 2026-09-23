export interface UserModel {
  id: string
  name: string
  email: string
}

export interface AuthPayloadModel {
  accessToken: string
  user: UserModel
}
