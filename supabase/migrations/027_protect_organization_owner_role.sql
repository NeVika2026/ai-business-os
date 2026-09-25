-- Reserve the owner role for existing organization owners.
-- Admins may manage non-owner memberships but cannot modify/delete an owner
-- or promote any membership to owner.

DROP POLICY IF EXISTS organization_members_insert ON public.organization_members;
DROP POLICY IF EXISTS organization_members_update ON public.organization_members;
DROP POLICY IF EXISTS organization_members_delete ON public.organization_members;

CREATE POLICY organization_members_insert ON public.organization_members
FOR INSERT TO authenticated
WITH CHECK (
  public.get_user_role(organization_id) = 'owner'
  OR (
    public.get_user_role(organization_id) = 'admin'
    AND role <> 'owner'
  )
);

CREATE POLICY organization_members_update ON public.organization_members
FOR UPDATE TO authenticated
USING (
  public.get_user_role(organization_id) = 'owner'
  OR (
    public.get_user_role(organization_id) = 'admin'
    AND role <> 'owner'
  )
)
WITH CHECK (
  public.get_user_role(organization_id) = 'owner'
  OR (
    public.get_user_role(organization_id) = 'admin'
    AND role <> 'owner'
  )
);

CREATE POLICY organization_members_delete ON public.organization_members
FOR DELETE TO authenticated
USING (
  public.get_user_role(organization_id) = 'owner'
  OR (
    public.get_user_role(organization_id) = 'admin'
    AND role <> 'owner'
  )
);
