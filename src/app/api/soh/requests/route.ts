import { GET as baseGET, PATCH as basePATCH } from "../payments/requests/route";

export async function GET(request: Request) {
  return baseGET();
}

export async function PATCH(request: Request) {
  return basePATCH(request);
}
