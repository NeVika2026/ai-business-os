import { CrmImportStudio } from '@/components/crm/CrmImportStudio';
import { requireOrganizationAdmin } from '@/utils/auth/authorization';

export default async function CrmImportPage() {
  await requireOrganizationAdmin();
  return <CrmImportStudio />;
}
